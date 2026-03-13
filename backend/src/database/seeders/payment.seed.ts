import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { PaymentStatusEnum } from 'src/shared/enums/payment-status.enum';

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const ERROR_CODES = [
    'INSUFFICIENT_FUNDS',
    'CARD_DECLINED',
    'EXPIRED_CARD',
    'INVALID_CVV',
    'PROCESSOR_ERROR',
    'FRAUD_DETECTED',
    'LIMIT_EXCEEDED',
];

function pickPaymentStatus(): PaymentStatusEnum {
    const rand = Math.random();
    if (rand < 0.70) return PaymentStatusEnum.PAID;
    if (rand < 0.85) return PaymentStatusEnum.FAILED;
    if (rand < 0.95) return PaymentStatusEnum.PENDING;
    return PaymentStatusEnum.TIMEOUT;
}

function generateGatewayResponse(status: PaymentStatusEnum): Record<string, any> {
    if (status === PaymentStatusEnum.PAID) {
        return {
            transactionId: `TXN-${randomUUID().substring(0, 12).toUpperCase()}`,
            gateway: 'stripe',
            approvalCode: String(randomBetween(100000, 999999)),
        };
    }
    if (status === PaymentStatusEnum.FAILED) {
        return {
            errorCode: ERROR_CODES[Math.floor(Math.random() * ERROR_CODES.length)],
            gateway: 'stripe',
            message: 'Payment was declined by the issuing bank',
        };
    }
    if (status === PaymentStatusEnum.TIMEOUT) {
        return {
            errorCode: 'GATEWAY_TIMEOUT',
            gateway: 'stripe',
            message: 'Payment gateway did not respond in time',
        };
    }
    return {
        gateway: 'stripe',
        status: 'processing',
    };
}

export async function seedPayments(
    dataSource: DataSource,
    orders: Order[],
): Promise<Payment[]> {
    const paymentRepository = dataSource.getRepository(Payment);

    console.log('Seeding payments...');

    if (orders.length === 0) {
        console.log('No orders found, skipping payment seeding');
        return [];
    }

    const payments: Partial<Payment>[] = [];
    let totalCreated = 0;

    // Deterministic test payments (for API testing)
    const testDelivered = orders.find((o) => o.trackingId === 'ORD-TEST-DELIVERED');
    const testCancelled = orders.find((o) => o.trackingId === 'ORD-TEST-CANCELLED');
    const testProcessing = orders.find((o) => o.trackingId === 'ORD-TEST-PROCESSING');

    if (testDelivered) {
        payments.push({
            orderId: testDelivered.id,
            amount: 82.50,
            status: PaymentStatusEnum.PAID,
            gatewayResponse: { transactionId: 'TXN-TEST-DELIVERED', gateway: 'stripe', approvalCode: '100001' },
            attemptNumber: 1,
            errorMessage: null,
            processingTime: 1200,
            correlationId: testDelivered.correlationId,
            createdAt: testDelivered.createdAt,
        });
        totalCreated++;
    }

    if (testCancelled) {
        payments.push(
            {
                orderId: testCancelled.id,
                amount: 16.50,
                status: PaymentStatusEnum.FAILED,
                gatewayResponse: { errorCode: 'CARD_DECLINED', gateway: 'stripe', message: 'Payment was declined by the issuing bank' },
                attemptNumber: 1,
                errorMessage: 'Payment declined by issuing bank',
                processingTime: 950,
                correlationId: testCancelled.correlationId,
                createdAt: testCancelled.createdAt,
            },
            {
                orderId: testCancelled.id,
                amount: 16.50,
                status: PaymentStatusEnum.FAILED,
                gatewayResponse: { errorCode: 'INSUFFICIENT_FUNDS', gateway: 'stripe', message: 'Insufficient funds in account' },
                attemptNumber: 2,
                errorMessage: 'Payment declined on retry - insufficient funds',
                processingTime: 1100,
                correlationId: testCancelled.correlationId,
                createdAt: new Date(new Date(testCancelled.createdAt).getTime() + 3600000),
            },
        );
        totalCreated += 2;
    }

    if (testProcessing) {
        payments.push({
            orderId: testProcessing.id,
            amount: 55.00,
            status: PaymentStatusEnum.PAID,
            gatewayResponse: { transactionId: 'TXN-TEST-PROCESSING', gateway: 'stripe', approvalCode: '100002' },
            attemptNumber: 1,
            errorMessage: null,
            processingTime: 800,
            correlationId: testProcessing.correlationId,
            createdAt: testProcessing.createdAt,
        });
        totalCreated++;
    }

    // Shuffle orders and pick enough to reach ~1800 payments
    // Most orders get 1 payment, some get retries (2-3 payments)
    const shuffledOrders = [...orders].filter((o) => !o.trackingId.startsWith('ORD-TEST-')).sort(() => Math.random() - 0.5);

    for (const order of shuffledOrders) {
        if (totalCreated >= 1800) break;

        const amount = Number(order.totalAmount);
        const firstStatus = pickPaymentStatus();
        const createdAt = new Date(order.createdAt);

        // First payment attempt
        payments.push({
            orderId: order.id,
            amount,
            status: firstStatus,
            gatewayResponse: generateGatewayResponse(firstStatus),
            attemptNumber: 1,
            errorMessage:
                firstStatus === PaymentStatusEnum.FAILED
                    ? 'Payment declined by issuing bank'
                    : firstStatus === PaymentStatusEnum.TIMEOUT
                        ? 'Gateway timeout after 30s'
                        : null,
            processingTime: randomBetween(500, 3000),
            correlationId: order.correlationId,
            createdAt,
        });
        totalCreated++;

        // If first attempt failed, add retry payments (20% chance of retry)
        if (
            (firstStatus === PaymentStatusEnum.FAILED || firstStatus === PaymentStatusEnum.TIMEOUT) &&
            Math.random() < 0.6 &&
            totalCreated < 1800
        ) {
            const retryDate = new Date(createdAt.getTime() + randomBetween(60000, 3600000));
            const retryStatus = Math.random() < 0.7 ? PaymentStatusEnum.PAID : PaymentStatusEnum.FAILED;

            payments.push({
                orderId: order.id,
                amount,
                status: retryStatus,
                gatewayResponse: generateGatewayResponse(retryStatus),
                attemptNumber: 2,
                errorMessage:
                    retryStatus === PaymentStatusEnum.FAILED
                        ? 'Payment declined on retry'
                        : null,
                processingTime: randomBetween(500, 3000),
                correlationId: order.correlationId,
                createdAt: retryDate,
            });
            totalCreated++;

            // Third attempt for still-failed retries
            if (retryStatus === PaymentStatusEnum.FAILED && Math.random() < 0.4 && totalCreated < 1800) {
                const thirdDate = new Date(retryDate.getTime() + randomBetween(60000, 3600000));
                const thirdStatus = Math.random() < 0.8 ? PaymentStatusEnum.PAID : PaymentStatusEnum.FAILED;

                payments.push({
                    orderId: order.id,
                    amount,
                    status: thirdStatus,
                    gatewayResponse: generateGatewayResponse(thirdStatus),
                    attemptNumber: 3,
                    errorMessage:
                        thirdStatus === PaymentStatusEnum.FAILED
                            ? 'Payment declined on third attempt'
                            : null,
                    processingTime: randomBetween(500, 3000),
                    correlationId: order.correlationId,
                    createdAt: thirdDate,
                });
                totalCreated++;
            }
        }
    }

    // Insert in batches of 300
    const savedPayments: Payment[] = [];
    for (let i = 0; i < payments.length; i += 300) {
        const batch = payments.slice(i, i + 300);
        const created = paymentRepository.create(batch);
        const saved = await paymentRepository.save(created);
        savedPayments.push(...saved);
        console.log(`  Payments batch ${Math.floor(i / 300) + 1}/${Math.ceil(payments.length / 300)} inserted`);
    }

    console.log(`Created ${savedPayments.length} payments`);
    return savedPayments;
}
