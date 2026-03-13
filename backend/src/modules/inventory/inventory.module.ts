import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryLog } from './entities/inventory-log.entity';
import { InventoryLogRepository } from './repositories/inventory-log.repository';
import { InventoryService } from './services/inventory.service';
import { WarehouseApiService } from './services/warehouse-api.service';
import { InventoryController } from './controllers/inventory.controller';
import { ProductsModule } from '../products/products.module';
import { I18nHelper } from '@core/utils/i18n.helper';

@Module({
    imports: [TypeOrmModule.forFeature([InventoryLog]), ProductsModule],
    controllers: [InventoryController],
    providers: [
        InventoryLogRepository,
        InventoryService,
        WarehouseApiService,
        I18nHelper,
    ],
    exports: [InventoryService],
})
export class InventoryModule {}
