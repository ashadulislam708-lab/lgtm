import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { I18nHelper } from '@core/utils/i18n.helper.js';
import { PaymentRepository } from '../repositories/payment.repository.js';
import { OrderRepository } from '@modules/orders/repositories/order.repository.js';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants.js';

@Injectable()
export class PaymentService {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly orderRepository: OrderRepository,
        private readonly i18nHelper: I18nHelper,
        @InjectQueue(QUEUE_NAMES.PAYMENT_PROCESSING)
        private readonly paymentQueue: Queue,
    ) {}

    /**
     * Enqueue a payment processing job
     */
    async processPayment(orderId: string): Promise<{ jobId: string; message: string }> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.payments.error.not_found'),
            );
        }

        const job = await this.paymentQueue.add('process-payment', {
            orderId: order.id,
            amount: Number(order.totalAmount),
            correlationId: order.correlationId,
        });

        return {
            jobId: job.id!,
            message: this.i18nHelper.t('translation.payments.success.enqueued'),
        };
    }

    /**
     * Get latest payment status for an order
     */
    async getPaymentStatus(orderId: string): Promise<{
        orderId: string;
        status: string;
        attempts: number;
        lastError: string | null;
    }> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.payments.error.not_found'),
            );
        }

        const latestPayment = await this.paymentRepository.getLatestByOrderId(orderId);

        return {
            orderId,
            status: latestPayment?.status ?? order.paymentStatus,
            attempts: latestPayment?.attemptNumber ?? order.paymentAttempts,
            lastError: latestPayment?.errorMessage ?? null,
        };
    }
}
