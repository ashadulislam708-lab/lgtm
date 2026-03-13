import { DataSource } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { User } from 'src/modules/users/user.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { NotificationTypeEnum } from 'src/shared/enums/notification-type.enum';

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const NOTIFICATION_TEMPLATES: Record<
    NotificationTypeEnum,
    { titles: string[]; messages: string[] }
> = {
    [NotificationTypeEnum.ORDER_PLACED]: {
        titles: [
            'Order Placed Successfully',
            'New Order Confirmed',
            'Order Received',
        ],
        messages: [
            'Your order has been placed successfully and is being processed.',
            'We have received your order. You will be notified when it ships.',
            'Thank you for your order! We are preparing it for shipment.',
        ],
    },
    [NotificationTypeEnum.PAYMENT_SUCCESS]: {
        titles: ['Payment Successful', 'Payment Confirmed', 'Payment Received'],
        messages: [
            'Your payment has been processed successfully.',
            'Payment confirmed. Your order is now being prepared.',
            'We have received your payment. Thank you!',
        ],
    },
    [NotificationTypeEnum.PAYMENT_FAILED]: {
        titles: ['Payment Failed', 'Payment Declined', 'Payment Error'],
        messages: [
            'Your payment could not be processed. Please try again.',
            'Payment was declined by your bank. Please use a different payment method.',
            'There was an error processing your payment. Please contact support.',
        ],
    },
    [NotificationTypeEnum.ORDER_SHIPPED]: {
        titles: [
            'Order Shipped',
            'Your Order is On Its Way',
            'Shipment Confirmation',
        ],
        messages: [
            'Your order has been shipped and is on its way to you.',
            'Great news! Your order has left our warehouse.',
            'Your order is now in transit. Track it with the tracking ID.',
        ],
    },
    [NotificationTypeEnum.INVENTORY_ALERT]: {
        titles: ['Low Stock Alert', 'Inventory Warning', 'Stock Level Update'],
        messages: [
            'A product in your wishlist is running low on stock.',
            'Inventory levels have dropped below the threshold.',
            'Stock update: Some items may be limited in availability.',
        ],
    },
    [NotificationTypeEnum.ORDER_DELIVERED]: {
        titles: [
            'Order Delivered',
            'Package Delivered',
            'Delivery Confirmation',
        ],
        messages: [
            'Your order has been delivered. Enjoy!',
            'Your package has been delivered to your address.',
            'Delivery confirmed. We hope you enjoy your purchase!',
        ],
    },
};

const NOTIFICATION_TYPES = Object.values(NotificationTypeEnum);

function pickNotificationType(): NotificationTypeEnum {
    return NOTIFICATION_TYPES[
        Math.floor(Math.random() * NOTIFICATION_TYPES.length)
    ];
}

export async function seedNotifications(
    dataSource: DataSource,
    users: User[],
    orders: Order[],
): Promise<void> {
    const notificationRepository = dataSource.getRepository(Notification);

    console.log('Seeding notifications...');

    if (users.length === 0) {
        console.log('No users found, skipping notification seeding');
        return;
    }

    // Build a map of userId to their orders
    const userOrderMap = new Map<string, Order[]>();
    for (const order of orders) {
        const list = userOrderMap.get(order.userId) || [];
        list.push(order);
        userOrderMap.set(order.userId, list);
    }

    // Only users who have orders
    const usersWithOrders = users.filter((u) => userOrderMap.has(u.id));
    if (usersWithOrders.length === 0) {
        console.log(
            'No users with orders found, skipping notification seeding',
        );
        return;
    }

    const notifications: Partial<Notification>[] = [];

    // Deterministic test notifications (for API testing)
    const testCustomer = users.find(
        (u) => u.email === 'test-customer@orderflow.com',
    );
    const testOrderPending = orders.find(
        (o) => o.trackingId === 'ORD-TEST-PENDING',
    );
    const testOrderDelivered = orders.find(
        (o) => o.trackingId === 'ORD-TEST-DELIVERED',
    );
    const testOrderCancelled = orders.find(
        (o) => o.trackingId === 'ORD-TEST-CANCELLED',
    );

    if (testCustomer) {
        if (testOrderPending) {
            notifications.push({
                userId: testCustomer.id,
                type: NotificationTypeEnum.ORDER_PLACED,
                title: 'Order Placed Successfully',
                message:
                    'Your order ORD-TEST-PENDING has been placed successfully and is being processed.',
                isRead: false,
                metadata: {
                    orderId: testOrderPending.id,
                    trackingId: testOrderPending.trackingId,
                },
                createdAt: testOrderPending.createdAt,
            });
        }

        if (testOrderDelivered) {
            const deliveredDate = new Date(testOrderDelivered.createdAt);
            notifications.push(
                {
                    userId: testCustomer.id,
                    type: NotificationTypeEnum.ORDER_PLACED,
                    title: 'Order Placed Successfully',
                    message:
                        'Your order ORD-TEST-DELIVERED has been placed successfully.',
                    isRead: true,
                    metadata: {
                        orderId: testOrderDelivered.id,
                        trackingId: testOrderDelivered.trackingId,
                    },
                    createdAt: deliveredDate,
                },
                {
                    userId: testCustomer.id,
                    type: NotificationTypeEnum.PAYMENT_SUCCESS,
                    title: 'Payment Confirmed',
                    message:
                        'Payment for order ORD-TEST-DELIVERED has been processed successfully.',
                    isRead: true,
                    metadata: {
                        orderId: testOrderDelivered.id,
                        trackingId: testOrderDelivered.trackingId,
                    },
                    createdAt: new Date(deliveredDate.getTime() + 60000),
                },
                {
                    userId: testCustomer.id,
                    type: NotificationTypeEnum.ORDER_SHIPPED,
                    title: 'Order Shipped',
                    message:
                        'Your order ORD-TEST-DELIVERED has been shipped and is on its way.',
                    isRead: true,
                    metadata: {
                        orderId: testOrderDelivered.id,
                        trackingId: testOrderDelivered.trackingId,
                    },
                    createdAt: new Date(
                        deliveredDate.getTime() + 2 * 24 * 60 * 60 * 1000,
                    ),
                },
                {
                    userId: testCustomer.id,
                    type: NotificationTypeEnum.ORDER_DELIVERED,
                    title: 'Order Delivered',
                    message:
                        'Your order ORD-TEST-DELIVERED has been delivered. Enjoy!',
                    isRead: true,
                    metadata: {
                        orderId: testOrderDelivered.id,
                        trackingId: testOrderDelivered.trackingId,
                    },
                    createdAt: new Date(
                        deliveredDate.getTime() + 5 * 24 * 60 * 60 * 1000,
                    ),
                },
            );
        }

        if (testOrderCancelled) {
            const cancelledDate = new Date(testOrderCancelled.createdAt);
            notifications.push(
                {
                    userId: testCustomer.id,
                    type: NotificationTypeEnum.ORDER_PLACED,
                    title: 'Order Placed Successfully',
                    message: 'Your order ORD-TEST-CANCELLED has been placed.',
                    isRead: false,
                    metadata: {
                        orderId: testOrderCancelled.id,
                        trackingId: testOrderCancelled.trackingId,
                    },
                    createdAt: cancelledDate,
                },
                {
                    userId: testCustomer.id,
                    type: NotificationTypeEnum.PAYMENT_FAILED,
                    title: 'Payment Failed',
                    message:
                        'Payment for order ORD-TEST-CANCELLED could not be processed.',
                    isRead: false,
                    metadata: {
                        orderId: testOrderCancelled.id,
                        trackingId: testOrderCancelled.trackingId,
                    },
                    createdAt: new Date(cancelledDate.getTime() + 60000),
                },
            );
        }
    }

    for (let i = 0; i < 3000; i++) {
        const user =
            usersWithOrders[Math.floor(Math.random() * usersWithOrders.length)];
        const userOrders = userOrderMap.get(user.id) || [];
        const order =
            userOrders.length > 0
                ? userOrders[Math.floor(Math.random() * userOrders.length)]
                : null;

        const type = pickNotificationType();
        const template = NOTIFICATION_TEMPLATES[type];
        const title =
            template.titles[Math.floor(Math.random() * template.titles.length)];
        const message =
            template.messages[
                Math.floor(Math.random() * template.messages.length)
            ];
        const isRead = Math.random() < 0.4;

        const metadata: Record<string, any> = {};
        if (order) {
            metadata.orderId = order.id;
            metadata.trackingId = order.trackingId;
        }

        const createdAt = order
            ? new Date(
                  new Date(order.createdAt).getTime() +
                      randomBetween(0, 86400000),
              )
            : new Date(
                  Date.now() - randomBetween(0, 180 * 24 * 60 * 60 * 1000),
              );

        notifications.push({
            userId: user.id,
            type,
            title,
            message,
            isRead,
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
            createdAt,
        });
    }

    // Insert in batches of 500
    for (let i = 0; i < notifications.length; i += 500) {
        const batch = notifications.slice(i, i + 500);
        const created = notificationRepository.create(batch);
        await notificationRepository.save(created);
        console.log(
            `  Notifications batch ${Math.floor(i / 500) + 1}/${Math.ceil(notifications.length / 500)} inserted`,
        );
    }

    console.log(`Created ${notifications.length} notifications`);
}
