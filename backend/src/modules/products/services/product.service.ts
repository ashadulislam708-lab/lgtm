import {
    Injectable,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { BaseService } from '@core/base';
import { I18nHelper } from '@core/utils/i18n.helper';
import { Product } from '../entities/product.entity';
import { ProductRepository } from '../repositories/product.repository';
import { CreateProductDto, ProductFilterDto, BulkImportProductDto } from '../dto';

@Injectable()
export class ProductService extends BaseService<Product> {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly i18nHelper: I18nHelper,
    ) {
        super(productRepository, 'Product');
    }

    /**
     * Get products with filters, search, sorting, and pagination
     */
    async getProducts(
        filterDto: ProductFilterDto,
    ): Promise<{ data: Product[]; total: number }> {
        return this.productRepository.findWithFilters(filterDto);
    }

    /**
     * Create a product with unique SKU validation
     */
    async createProduct(dto: CreateProductDto): Promise<Product> {
        const existingProduct = await this.productRepository.findBySku(dto.sku);
        if (existingProduct) {
            throw new ConflictException(
                this.i18nHelper.t('translation.products.error.sku_exists', {
                    sku: dto.sku,
                }),
            );
        }

        return this.productRepository.create(dto);
    }

    /**
     * Update a product by ID
     */
    async updateProduct(
        id: string,
        dto: Partial<CreateProductDto>,
    ): Promise<Product | null> {
        await this.findByIdOrFail(id);

        if (dto.sku) {
            const existingProduct = await this.productRepository.findBySku(dto.sku);
            if (existingProduct && existingProduct.id !== id) {
                throw new ConflictException(
                    this.i18nHelper.t('translation.products.error.sku_exists', {
                        sku: dto.sku,
                    }),
                );
            }
        }

        return this.productRepository.update(id, dto);
    }

    /**
     * Bulk import products with error collection
     */
    async bulkImport(
        dto: BulkImportProductDto,
    ): Promise<{ imported: Product[]; errors: { index: number; error: string }[] }> {
        const imported: Product[] = [];
        const errors: { index: number; error: string }[] = [];

        for (let i = 0; i < dto.products.length; i++) {
            const productDto = dto.products[i];
            const existingProduct = await this.productRepository.findBySku(
                productDto.sku,
            );

            if (existingProduct) {
                errors.push({
                    index: i,
                    error: this.i18nHelper.t(
                        'translation.products.error.sku_exists',
                        { sku: productDto.sku },
                    ),
                });
                continue;
            }

            const product = await this.productRepository.create(productDto);
            imported.push(product);
        }

        return { imported, errors };
    }

    /**
     * Get distinct product categories
     */
    async getCategories(): Promise<string[]> {
        return this.productRepository.getDistinctCategories();
    }

    /**
     * Check if sufficient stock is available for a product
     */
    async checkStock(
        productId: string,
        quantity: number,
    ): Promise<{ available: boolean; currentStock: number }> {
        const product = await this.findByIdOrFail(productId);

        return {
            available: product.stockQuantity >= quantity,
            currentStock: product.stockQuantity,
        };
    }
}
