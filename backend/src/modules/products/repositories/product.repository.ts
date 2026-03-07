import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base';
import { Product } from '../entities/product.entity';
import { ProductFilterDto } from '../dto';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
    constructor(
        @InjectRepository(Product)
        repository: Repository<Product>,
    ) {
        super(repository);
    }

    /**
     * Find products with filters, search, sorting, and pagination
     */
    async findWithFilters(
        filterDto: ProductFilterDto,
    ): Promise<{ data: Product[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            search,
            category,
            priceMin,
            priceMax,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        } = filterDto;

        const qb = this.repository
            .createQueryBuilder('product')
            .where('product.isActive = :isActive', { isActive: true });

        if (search) {
            qb.andWhere(
                '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
                { search: `%${search}%` },
            );
        }

        if (category) {
            qb.andWhere('LOWER(product.category) = LOWER(:category)', {
                category,
            });
        }

        if (priceMin !== undefined) {
            qb.andWhere('product.price >= :priceMin', { priceMin });
        }

        if (priceMax !== undefined) {
            qb.andWhere('product.price <= :priceMax', { priceMax });
        }

        const allowedSortFields = ['name', 'price', 'createdAt'];
        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        qb.orderBy(`product.${safeSortBy}`, sortOrder);

        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return { data, total };
    }

    /**
     * Find a product by SKU
     */
    async findBySku(sku: string): Promise<Product | null> {
        return this.repository.findOne({
            where: { sku },
        });
    }

    /**
     * Find products by category
     */
    async findByCategory(category: string): Promise<Product[]> {
        return this.repository
            .createQueryBuilder('product')
            .where('LOWER(product.category) = LOWER(:category)', { category })
            .andWhere('product.isActive = :isActive', { isActive: true })
            .orderBy('product.name', 'ASC')
            .getMany();
    }

    /**
     * Bulk create products
     */
    async bulkCreate(products: Partial<Product>[]): Promise<Product[]> {
        const entities = this.repository.create(products);
        return this.repository.save(entities);
    }

    /**
     * Get distinct categories
     */
    async getDistinctCategories(): Promise<string[]> {
        const result = await this.repository
            .createQueryBuilder('product')
            .select('DISTINCT product.category', 'category')
            .where('product.isActive = :isActive', { isActive: true })
            .orderBy('product.category', 'ASC')
            .getRawMany();

        return result.map((r) => r.category);
    }
}
