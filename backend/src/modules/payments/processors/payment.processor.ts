import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentGatewayService } from '../services/payment-gateway.service';
import { Payment } from '../entities/payment.entity';
import { Order } from '@modules/orders/entities/order.entity';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants';

interface PaymentJobData {
    orderId: string;
    amount: number;
    correlationId: string;
}

@Processor(QUEUE_NAMES.PAYMENT_PROCESSING)
export class PaymentProcessor extends WorkerHost {
    private readonly logger = new Logger(PaymentProcessor.name);

    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentGatewayService: PaymentGatewayService,
        private readonly dataSource: DataSource,
        @InjectQueue(QUEUE_NAMES.NOTIFICATION)
        private readonly notificationQueue: Queue,
    ) {
        super();
    }

    async process(job: Job<PaymentJobData>): Promise<void> {
        const { orderId, amount, correlationId } = job.data;
        const attemptNumber = job.attemptsMade + 1;

        this.logger.log(
            `Processing payment for order ${orderId}, attempt ${attemptNumber}, correlationId: ${correlationId}`,
        );

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let payment: Payment | undefined;

        try {
            // Get current order
            const order = await queryRunner.manager.findOne(Order, {
                where: { id: orderId },
            });

            if (!order) {
                this.logger.error(`Order ${orderId} not found`);
                await queryRunner.rollbackTransaction();
                return;
            }

            // Create payment record with PROCESSING status
            payment = queryRunner.manager.create(Payment, {
                orderId,
                amount,
                status: PaymentStatusEnum.PROCESSING,
                attemptNumber,
                correlationId,
                gatewayResponse: null,
                errorMessage: null,
                processingTime: null,
            });
            payment = await queryRunner.manager.save(Payment, payment);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(
                `Failed to create payment record for order ${orderId}: ${(error as Error).message}`,
            );
            throw error;
        } finally {
            await queryRunner.release();
        }

        // Call the payment gateway (outside the transaction)
        try {
            const result = await this.paymentGatewayService.charge(amount, correlationId);

            if (result.success) {
                // Payment succeeded
                await this.paymentRepository.update(payment.id, {
                    status: PaymentStatusEnum.PAID,
                    gatewayResponse: result as any,
                    processingTime: result.processingTime,
                } as any);

                await this.dataSource.manager.update(Order, orderId, {
                    paymentStatus: PaymentStatusEnum.PAID,
                });

                await this.notificationQueue.add('send-notification', {
                    userId: (await this.dataSource.manager.findOne(Order, { where: { id: orderId } }))?.userId,
                    type: 'payment_success',
                    title: 'Payment Successful',
                    message: `Payment of ${amount} processed successfully`,
                    metadata: { orderId, amount, correlationId },
                });

                this.logger.log(`Payment succeeded for order ${orderId}`);
            } else {
                // Payment failed (gateway declined)
                await this.paymentRepository.update(payment.id, {
                    status: PaymentStatusEnum.FAILED,
                    errorMessage: result.message,
                    gatewayResponse: result as any,
                    processingTime: result.processingTime,
                } as any);

                await this.dataSource.manager.update(Order, orderId, {
                    paymentStatus: PaymentStatusEnum.FAILED,
                    paymentAttempts: () => 'payment_attempts + 1',
                } as any);

                await this.notificationQueue.add('send-notification', {
                    userId: (await this.dataSource.manager.findOne(Order, { where: { id: orderId } }))?.userId,
                    type: 'payment_failed',
                    title: 'Payment Failed',
                    message: `Payment of ${amount} failed: ${result.message}`,
                    metadata: { orderId, amount, correlationId, errorCode: result.errorCode },
                });

                this.logger.warn(
                    `Payment failed for order ${orderId}: ${result.message}`,
                );

                // Retry if under max attempts
                if (attemptNumber < 3) {
                    throw new Error(`Payment declined for order ${orderId}, retrying...`);
                }
            }
        } catch (error) {
            const errorMessage = (error as Error).message;

            // Check if this is a timeout error from the gateway
            if (errorMessage === 'Payment gateway timed out') {
                await this.paymentRepository.update(payment.id, {
                    status: PaymentStatusEnum.TIMEOUT,
                    errorMessage: errorMessage,
                } as any);

                await this.dataSource.manager.update(Order, orderId, {
                    paymentAttempts: () => 'payment_attempts + 1',
                } as any);

                this.logger.warn(
                    `Payment timed out for order ${orderId}, attempt ${attemptNumber}`,
                );

                if (attemptNumber < 3) {
                    throw error;
                }
                return;
            }

            // Re-throw for BullMQ retry on non-terminal errors
            throw error;
        }
    }
}
