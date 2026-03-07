import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import { RolesEnum } from '@shared/enums/role.enum';
import {
    SuccessResponseDto,
    PaginatedResponseDto,
    UpdatedResponseDto,
} from '@shared/dtos/response.dto';
import { Product } from '../../products/entities/product.entity';
import { InventoryService } from '../services/inventory.service';
import { InventoryFilterDto, UpdateStockDto } from '../dto';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(RolesGuard)
@Roles(RolesEnum.ADMIN)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {}

    /**
     * List inventory (products with stock info)
     * Access: Admin only
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Inventory',
        operation: 'getAll',
        responseDto: Product,
        isArray: true,
        requiresAuth: true,
        withPagination: true,
    })
    async getInventory(
        @Query() filterDto: InventoryFilterDto,
    ): Promise<PaginatedResponseDto<Product>> {
        const { data, total } = await this.inventoryService.getInventory(filterDto);
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 10;

        return new PaginatedResponseDto(data, page, limit, total);
    }

    /**
     * Sync inventory with simulated warehouse
     * Access: Admin only
     */
    @Post('sync')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Inventory Sync',
        operation: 'custom',
        summary: 'Sync inventory with simulated warehouse API',
        requiresAuth: true,
    })
    async syncInventory(): Promise<SuccessResponseDto<any>> {
        const result = await this.inventoryService.syncInventory();
        return new SuccessResponseDto(result, 'Inventory synced successfully');
    }

    /**
     * Manual stock update for a product
     * Access: Admin only
     */
    @Patch(':productId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Inventory',
        operation: 'update',
        requestDto: UpdateStockDto,
        responseDto: Product,
        requiresAuth: true,
    })
    async updateStock(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Body() dto: UpdateStockDto,
    ): Promise<UpdatedResponseDto<Product>> {
        const product = await this.inventoryService.updateStock(
            productId,
            dto.stockQuantity,
        );
        return new UpdatedResponseDto(product, 'Stock updated successfully');
    }
}
