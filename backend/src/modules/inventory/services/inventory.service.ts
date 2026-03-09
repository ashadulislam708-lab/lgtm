import {
    Injectable,
    Logger,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { I18nHelper } from '@core/utils/i18n.helper';
import { InventorySourceEnum } from '@shared/enums/inventory-source.enum';
import { Product } from '../../products/entities/product.entity';
import { InventoryLog } from '../entities/inventory-log.entity';
import { InventoryLogRepository } from '../repositories/inventory-log.repository';
import { ProductRepository } from '../../products/repositories/product.repository';
import { WarehouseApiService } from './warehouse-api.service';
import { InventoryFilterDto } from '../dto';

interface SyncDetail {
    sku: string;
    productId: string;
    previousQuantity: number;
    newQuantity: number;
    discrepancy: number;
}

interface SyncResult {
    synced: number;
    discrepancies: number;
    syncCorrelationId: string;
    details: SyncDetail[];
}

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        private readonly inventoryLogRepository: InventoryLogRepository,
        private readonly productRepository: ProductRepository,
        private readonly warehouseApiService: WarehouseApiService,
        private readonly i18nHelper: I18nHelper,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Get inventory list - products with stock info, supports filtering and pagination
     */
    async getInventory(
        filterDto: InventoryFilterDto,
    ): Promise<{ data: Product[]; total: number }> {
        const { page = 1, limit = 10, lowStock, category } = filterDto;

        const qb = this.dataSource
            .getRepository(Product)
            .createQueryBuilder('product')
            .where('product.isActive = :isActive', { isActive: true });

        if (lowStock) {
            qb.andWhere('product.stockQuantity < :threshold', {
                threshold: 10,
            });
        }

        if (category) {
            qb.andWhere('LOWER(product.category) = LOWER(:category)', {
                category,
            });
        }

        qb.orderBy('product.stockQuantity', 'ASC');

        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return { data, total };
    }

    /**
     * Sync inventory with the simulated warehouse API.
     * Compares warehouse stock levels with DB and logs discrepancies.
     */
    async syncInventory(): Promise<SyncResult> {
        const syncCorrelationId = randomUUID();

        const products = await this.productRepository.findAll({
            where: { isActive: true } as any,
        });

        let stockLevels;
        try {
            stockLevels = await this.warehouseApiService.getStockLevels(products);
        } catch (error) {
            this.logger.error(
                `Inventory sync failed: ${(error as Error).message}`,
            );
            throw new InternalServerErrorException(
                this.i18nHelper.t('translation.inventory.error.warehouse_timeout'),
            );
        }

        const skuToStockLevel = new Map(
            stockLevels.map((sl) => [sl.sku, sl.quantity]),
        );

        const details: SyncDetail[] = [];
        let synced = 0;
        let discrepancies = 0;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const product of products) {
                const warehouseQuantity = skuToStockLevel.get(product.sku);

                if (warehouseQuantity === undefined) {
                    continue;
                }

                if (warehouseQuantity !== product.stockQuantity) {
                    const discrepancy = warehouseQuantity - product.stockQuantity;

                    const log = queryRunner.manager.create(InventoryLog, {
                        productId: product.id,
                        previousQuantity: product.stockQuantity,
                        newQuantity: warehouseQuantity,
                        source: InventorySourceEnum.SYNC,
                        discrepancy,
                        syncCorrelationId,
                    });
                    await queryRunner.manager.save(log);

                    await queryRunner.manager.update(Product, product.id, {
                        stockQuantity: warehouseQuantity,
                    });

                    details.push({
                        sku: product.sku,
                        productId: product.id,
                        previousQuantity: product.stockQuantity,
                        newQuantity: warehouseQuantity,
                        discrepancy,
                    });

                    synced++;
                    discrepancies++;
                }
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(
                `Inventory sync transaction failed: ${(error as Error).message}`,
            );
            throw new InternalServerErrorException(
                this.i18nHelper.t('translation.inventory.error.sync_failed'),
            );
        } finally {
            await queryRunner.release();
        }

        this.logger.log(
            `Inventory sync completed: ${synced} products synced, ${discrepancies} discrepancies found (correlationId: ${syncCorrelationId})`,
        );

        return {
            synced,
            discrepancies,
            syncCorrelationId,
            details,
        };
    }

    /**
     * Manually update the stock quantity for a product.
     * Creates an inventory log entry and updates the product.
     */
    async updateStock(productId: string, quantity: number): Promise<Product> {
        const product = await this.productRepository.findById(productId);

        if (!product) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.inventory.error.product_not_found'),
            );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const log = queryRunner.manager.create(InventoryLog, {
                productId: product.id,
                previousQuantity: product.stockQuantity,
                newQuantity: quantity,
                source: InventorySourceEnum.MANUAL,
            });
            await queryRunner.manager.save(log);

            await queryRunner.manager.update(Product, product.id, {
                stockQuantity: quantity,
            });

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        const updatedProduct = await this.productRepository.findById(productId);
        return updatedProduct!;
    }
}
