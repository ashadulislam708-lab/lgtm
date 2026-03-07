import { Injectable, Logger } from '@nestjs/common';
import { ChaosConfigService } from '../../chaos/services/chaos-config.service';
import { Product } from '../../products/entities/product.entity';

export interface WarehouseStockLevel {
    sku: string;
    quantity: number;
}

@Injectable()
export class WarehouseApiService {
    private readonly logger = new Logger(WarehouseApiService.name);

    constructor(
        private readonly chaosConfigService: ChaosConfigService,
    ) {}

    /**
     * Simulate fetching stock levels from an external warehouse API.
     * Uses chaos config to introduce latency and timeouts.
     */
    async getStockLevels(products: Product[]): Promise<WarehouseStockLevel[]> {
        const warehouseConfig = this.chaosConfigService.getWarehouseApiConfig();

        const delay = this.chaosConfigService.getRandomLatency(
            warehouseConfig.latencyMs.min,
            warehouseConfig.latencyMs.max,
        );

        const willTimeout = this.chaosConfigService.shouldTimeout(
            warehouseConfig.timeoutRate,
        );

        if (willTimeout) {
            this.logger.warn(
                `Warehouse API simulating timeout after ${delay}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            throw new Error('Warehouse API timed out');
        }

        this.logger.debug(`Warehouse API simulating ${delay}ms latency`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return products.map((product) => ({
            sku: product.sku,
            quantity: product.stockQuantity + Math.floor(Math.random() * 11) - 5,
        }));
    }
}
