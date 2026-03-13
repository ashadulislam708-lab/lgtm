import { DataSource } from 'typeorm';
import { OrderItem } from 'src/modules/orders/entities/order-item.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { Product } from 'src/modules/products/entities/product.entity';

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedOrderItems(
    dataSource: DataSource,
    orders: Order[],
    products: Product[],
): Promise<OrderItem[]> {
    const orderItemRepository = dataSource.getRepository(OrderItem);

    console.log('Seeding order items...');

    if (products.length === 0 || orders.length === 0) {
        console.log('No products or orders found, skipping order item seeding');
        return [];
    }

    const allItems: Partial<OrderItem>[] = [];

    // Deterministic test order items (for API testing)
    const testOrders = orders.filter((o) =>
        o.trackingId.startsWith('ORD-TEST-'),
    );
    const testProductAlpha = products.find((p) => p.sku === 'TEST-PROD-001');
    const testProductBeta = products.find((p) => p.sku === 'TEST-PROD-002');
    const testProductGamma = products.find((p) => p.sku === 'TEST-PROD-003');

    for (const testOrder of testOrders) {
        if (testOrder.trackingId === 'ORD-TEST-PENDING' && testProductAlpha) {
            allItems.push({
                orderId: testOrder.id,
                productId: testProductAlpha.id,
                quantity: 1,
                unitPrice: 25.0,
                totalPrice: 25.0,
            });
        } else if (
            testOrder.trackingId === 'ORD-TEST-DELIVERED' &&
            testProductBeta
        ) {
            allItems.push({
                orderId: testOrder.id,
                productId: testProductBeta.id,
                quantity: 1,
                unitPrice: 75.0,
                totalPrice: 75.0,
            });
        } else if (
            testOrder.trackingId === 'ORD-TEST-CANCELLED' &&
            testProductGamma
        ) {
            allItems.push({
                orderId: testOrder.id,
                productId: testProductGamma.id,
                quantity: 1,
                unitPrice: 15.0,
                totalPrice: 15.0,
            });
        } else if (
            testOrder.trackingId === 'ORD-TEST-PROCESSING' &&
            testProductAlpha
        ) {
            allItems.push({
                orderId: testOrder.id,
                productId: testProductAlpha.id,
                quantity: 2,
                unitPrice: 25.0,
                totalPrice: 50.0,
            });
        }
    }

    for (const order of orders) {
        // Skip test orders (already handled above)
        if (order.trackingId.startsWith('ORD-TEST-')) continue;

        const itemCount = randomBetween(2, 5);
        const usedProductIndices = new Set<number>();

        for (let j = 0; j < itemCount; j++) {
            let productIndex: number;
            do {
                productIndex = Math.floor(Math.random() * products.length);
            } while (
                usedProductIndices.has(productIndex) &&
                usedProductIndices.size < products.length
            );
            usedProductIndices.add(productIndex);

            const product = products[productIndex];
            const quantity = randomBetween(1, 5);
            const unitPrice = Number(product.price);
            const totalPrice = Math.round(unitPrice * quantity * 100) / 100;

            allItems.push({
                orderId: order.id,
                productId: product.id,
                quantity,
                unitPrice,
                totalPrice,
            });
        }
    }

    // Insert in batches of 500
    const savedItems: OrderItem[] = [];
    for (let i = 0; i < allItems.length; i += 500) {
        const batch = allItems.slice(i, i + 500);
        const created = orderItemRepository.create(batch);
        const saved = await orderItemRepository.save(created);
        savedItems.push(...saved);
        if ((i / 500) % 3 === 0) {
            console.log(
                `  Order items batch ${Math.floor(i / 500) + 1}/${Math.ceil(allItems.length / 500)} inserted`,
            );
        }
    }

    console.log(`Created ${savedItems.length} order items`);
    return savedItems;
}
