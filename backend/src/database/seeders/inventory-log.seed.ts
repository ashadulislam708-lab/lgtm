import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { InventoryLog } from 'src/modules/inventory/entities/inventory-log.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { InventorySourceEnum } from 'src/shared/enums/inventory-source.enum';

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickSource(): InventorySourceEnum {
    const rand = Math.random();
    if (rand < 0.6) return InventorySourceEnum.SYNC;
    if (rand < 0.8) return InventorySourceEnum.ORDER;
    if (rand < 0.95) return InventorySourceEnum.MANUAL;
    return InventorySourceEnum.BULK_IMPORT;
}

export async function seedInventoryLogs(
    dataSource: DataSource,
    products: Product[],
): Promise<void> {
    const inventoryLogRepository = dataSource.getRepository(InventoryLog);

    console.log('Seeding inventory logs...');

    if (products.length === 0) {
        console.log('No products found, skipping inventory log seeding');
        return;
    }

    const logs: Partial<InventoryLog>[] = [];

    // Group SYNC records by correlation ID (batches of 5-15 products per sync)
    const syncCorrelationIds: string[] = [];
    for (let i = 0; i < 20; i++) {
        syncCorrelationIds.push(randomUUID());
    }

    for (let i = 0; i < 500; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const source = pickSource();
        const previousQuantity = randomBetween(0, 500);

        let newQuantity: number;
        let discrepancy: number | undefined;
        let syncCorrelationId: string | undefined;

        switch (source) {
            case InventorySourceEnum.ORDER:
                // Orders reduce quantity by 1-5
                newQuantity = Math.max(
                    0,
                    previousQuantity - randomBetween(1, 5),
                );
                break;
            case InventorySourceEnum.SYNC:
                // Sync can have small discrepancies
                syncCorrelationId =
                    syncCorrelationIds[
                        Math.floor(Math.random() * syncCorrelationIds.length)
                    ];
                if (Math.random() < 0.3) {
                    // 30% of sync records have discrepancy
                    discrepancy = randomBetween(-10, 10);
                    newQuantity = previousQuantity + discrepancy;
                    if (newQuantity < 0) newQuantity = 0;
                } else {
                    newQuantity = previousQuantity;
                }
                break;
            case InventorySourceEnum.MANUAL:
                // Manual adjustments can go up or down
                newQuantity = previousQuantity + randomBetween(-20, 50);
                if (newQuantity < 0) newQuantity = 0;
                break;
            case InventorySourceEnum.BULK_IMPORT:
                // Bulk imports typically add stock
                newQuantity = previousQuantity + randomBetween(50, 200);
                break;
            default:
                newQuantity = previousQuantity;
        }

        const createdAt = new Date(
            Date.now() - randomBetween(0, 180 * 24 * 60 * 60 * 1000),
        );

        logs.push({
            productId: product.id,
            previousQuantity,
            newQuantity,
            source,
            discrepancy: discrepancy ?? undefined,
            syncCorrelationId: syncCorrelationId ?? undefined,
            createdAt,
        });
    }

    // Insert in batches of 250
    for (let i = 0; i < logs.length; i += 250) {
        const batch = logs.slice(i, i + 250);
        const created = inventoryLogRepository.create(batch);
        await inventoryLogRepository.save(created);
        console.log(
            `  Inventory logs batch ${Math.floor(i / 250) + 1}/${Math.ceil(logs.length / 250)} inserted`,
        );
    }

    console.log(`Created ${logs.length} inventory log records`);
}
