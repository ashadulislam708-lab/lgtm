import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { Order } from 'src/modules/orders/entities/order.entity';
import { User } from 'src/modules/users/user.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { OrderStatusEnum } from 'src/shared/enums/order-status.enum';
import { PaymentStatusEnum } from 'src/shared/enums/payment-status.enum';
import { RolesEnum } from 'src/shared/enums/role.enum';

const ADDRESSES = [
    '123 Main St, New York, NY 10001',
    '456 Oak Ave, Los Angeles, CA 90001',
    '789 Pine Rd, Chicago, IL 60601',
    '321 Elm St, Houston, TX 77001',
    '654 Maple Dr, Phoenix, AZ 85001',
    '987 Cedar Ln, Philadelphia, PA 19101',
    '147 Birch Ct, San Antonio, TX 78201',
    '258 Walnut Way, San Diego, CA 92101',
    '369 Spruce Blvd, Dallas, TX 75201',
    '741 Ash St, San Jose, CA 95101',
];

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(monthsBack: number): Date {
    const now = new Date();
    const past = new Date(now.getTime() - monthsBack * 30 * 24 * 60 * 60 * 1000);
    const diff = now.getTime() - past.getTime();
    return new Date(past.getTime() + Math.random() * diff);
}

function generateTrackingId(index: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `ORD-${suffix}${String(index).padStart(2, '0')}`;
}

function pickStatus(): OrderStatusEnum {
    const rand = Math.random();
    if (rand < 0.40) return OrderStatusEnum.DELIVERED;
    if (rand < 0.60) return OrderStatusEnum.SHIPPED;
    if (rand < 0.75) return OrderStatusEnum.PROCESSING;
    if (rand < 0.85) return OrderStatusEnum.CONFIRMED;
    if (rand < 0.95) return OrderStatusEnum.PENDING;
    return OrderStatusEnum.CANCELLED;
}

function getPaymentStatus(orderStatus: OrderStatusEnum): PaymentStatusEnum {
    switch (orderStatus) {
        case OrderStatusEnum.DELIVERED:
        case OrderStatusEnum.SHIPPED:
            return PaymentStatusEnum.PAID;
        case OrderStatusEnum.CANCELLED:
            return PaymentStatusEnum.FAILED;
        case OrderStatusEnum.PROCESSING:
        case OrderStatusEnum.CONFIRMED: {
            const r = Math.random();
            return r < 0.7 ? PaymentStatusEnum.PAID : PaymentStatusEnum.PROCESSING;
        }
        case OrderStatusEnum.PENDING:
        default:
            return PaymentStatusEnum.PENDING;
    }
}

export async function seedOrders(
    dataSource: DataSource,
    users: User[],
    _products: Product[],
): Promise<Order[]> {
    const orderRepository = dataSource.getRepository(Order);

    console.log('Seeding orders...');

    const customers = users.filter((u) => u.role === RolesEnum.USER);
    if (customers.length === 0) {
        console.log('No customers found, skipping order seeding');
        return [];
    }

    const orders: Partial<Order>[] = [];

    // 4 Deterministic test orders (for API testing)
    const testCustomer = users.find((u) => u.email === 'test-customer@orderflow.com');
    if (testCustomer) {
        const now = Date.now();
        orders.push(
            {
                trackingId: 'ORD-TEST-PENDING',
                userId: testCustomer.id,
                status: OrderStatusEnum.PENDING,
                totalAmount: 27.50,
                taxAmount: 2.50,
                shippingAddress: '100 Test St, New York, NY 10001',
                paymentStatus: PaymentStatusEnum.PENDING,
                paymentAttempts: 0,
                correlationId: randomUUID(),
                createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
            },
            {
                trackingId: 'ORD-TEST-DELIVERED',
                userId: testCustomer.id,
                status: OrderStatusEnum.DELIVERED,
                totalAmount: 82.50,
                taxAmount: 7.50,
                shippingAddress: '100 Test St, New York, NY 10001',
                paymentStatus: PaymentStatusEnum.PAID,
                paymentAttempts: 1,
                correlationId: randomUUID(),
                createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
            },
            {
                trackingId: 'ORD-TEST-CANCELLED',
                userId: testCustomer.id,
                status: OrderStatusEnum.CANCELLED,
                totalAmount: 16.50,
                taxAmount: 1.50,
                shippingAddress: '100 Test St, New York, NY 10001',
                paymentStatus: PaymentStatusEnum.FAILED,
                paymentAttempts: 2,
                correlationId: randomUUID(),
                createdAt: new Date(now - 45 * 24 * 60 * 60 * 1000),
            },
            {
                trackingId: 'ORD-TEST-PROCESSING',
                userId: testCustomer.id,
                status: OrderStatusEnum.PROCESSING,
                totalAmount: 55.00,
                taxAmount: 5.00,
                shippingAddress: '100 Test St, New York, NY 10001',
                paymentStatus: PaymentStatusEnum.PAID,
                paymentAttempts: 1,
                correlationId: randomUUID(),
                createdAt: new Date(now - 14 * 24 * 60 * 60 * 1000),
            },
        );
    }

    for (let i = 0; i < 1500; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const status = pickStatus();
        const paymentStatus = getPaymentStatus(status);
        const subtotal = randomBetween(20, 500);
        const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
        const paymentAttempts =
            paymentStatus === PaymentStatusEnum.FAILED
                ? randomBetween(1, 3)
                : paymentStatus === PaymentStatusEnum.PAID
                    ? 1
                    : 0;

        orders.push({
            trackingId: generateTrackingId(i),
            userId: customer.id,
            status,
            totalAmount,
            taxAmount,
            shippingAddress: ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)],
            paymentStatus,
            paymentAttempts,
            correlationId: randomUUID(),
            createdAt: randomDate(6),
        });
    }

    // Insert in batches of 300
    const savedOrders: Order[] = [];
    for (let i = 0; i < orders.length; i += 300) {
        const batch = orders.slice(i, i + 300);
        const created = orderRepository.create(batch);
        const saved = await orderRepository.save(created);
        savedOrders.push(...saved);
        console.log(`  Orders batch ${Math.floor(i / 300) + 1}/${Math.ceil(orders.length / 300)} inserted`);
    }

    console.log(`Created ${savedOrders.length} orders`);
    return savedOrders;
}
