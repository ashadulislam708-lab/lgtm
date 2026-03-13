import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from '@core/base';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator';
import { Public } from '@core/decorators/public.decorator';
import {
    CreatedResponseDto,
    SuccessResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
    PaginatedResponseDto,
} from '@shared/dtos/response.dto';
import { Product } from '../entities/product.entity';
import { ProductService } from '../services/product.service';
import {
    CreateProductDto,
    UpdateProductDto,
    ProductFilterDto,
    BulkImportProductDto,
} from '../dto';

@ApiTags('Products')
@Controller('products')
export class ProductController extends BaseController<
    Product,
    CreateProductDto,
    UpdateProductDto
> {
    constructor(private readonly productService: ProductService) {
        super(productService);
    }

    /**
     * List products with filters and pagination
     * Access: Public
     */
    @Get()
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Products',
        operation: 'getAll',
        responseDto: Product,
        isArray: true,
        requiresAuth: false,
        withPagination: true,
    })
    async findAll(
        @Query() filterDto: ProductFilterDto,
    ): Promise<PaginatedResponseDto<Product>> {
        const { data, total } = await this.productService.getProducts(filterDto);
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 10;

        return new PaginatedResponseDto(data, page, limit, total);
    }

    /**
     * Get distinct product categories
     * Access: Public
     */
    @Get('categories')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Product Categories',
        operation: 'custom',
        summary: 'Get all distinct product categories',
        requiresAuth: false,
    })
    async getCategories(): Promise<SuccessResponseDto<string[]>> {
        const categories = await this.productService.getCategories();
        return new SuccessResponseDto(categories);
    }

    /**
     * Get a product by ID
     * Access: Public
     */
    @Get(':id')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Product',
        operation: 'getOne',
        responseDto: Product,
        requiresAuth: false,
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SuccessResponseDto<Product>> {
        return super.findOne(id);
    }

    /**
     * Create a new product
     * Access: Admin only
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Product',
        operation: 'create',
        requestDto: CreateProductDto,
        responseDto: Product,
        successStatus: 201,
        requiresAuth: true,
    })
    async create(
        @Body() createProductDto: CreateProductDto,
    ): Promise<CreatedResponseDto<Product>> {
        const product = await this.productService.createProduct(createProductDto);
        return new CreatedResponseDto(product);
    }

    /**
     * Update a product
     * Access: Admin only
     */
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Product',
        operation: 'update',
        requestDto: UpdateProductDto,
        responseDto: Product,
        requiresAuth: true,
    })
    async updateProduct(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateProductDto: UpdateProductDto,
    ): Promise<UpdatedResponseDto<Product>> {
        const product = await this.productService.updateProduct(
            id,
            updateProductDto,
        );
        const entity = product || (await this.productService.findByIdOrFail(id));
        return new UpdatedResponseDto(entity);
    }

    /**
     * Soft delete a product
     * Access: Admin only
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Product',
        operation: 'delete',
        requiresAuth: true,
    })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<DeletedResponseDto> {
        return super.remove(id);
    }

    /**
     * Bulk import products
     * Access: Admin only
     */
    @Post('bulk-import')
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Products',
        operation: 'custom',
        summary: 'Bulk import products',
        requestDto: BulkImportProductDto,
        successStatus: 201,
        requiresAuth: true,
    })
    async bulkImport(
        @Body() bulkImportDto: BulkImportProductDto,
    ): Promise<CreatedResponseDto<{ imported: Product[]; errors: { index: number; error: string }[] }>> {
        const result = await this.productService.bulkImport(bulkImportDto);
        return new CreatedResponseDto(result);
    }
}
