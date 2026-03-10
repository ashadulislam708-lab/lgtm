import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsRelations } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Order } from '../entities/order.entity';
import { OrderFilterDto } from '../dto/order-filter.dto';
import { RolesEnum } from '@shared/enums/role.enum';

@Injectable()
export class OrderRepository extends BaseRepository<Order> {
    protected defaultRelations: FindOptionsRelations<Order> = {
        items: { product: true },
        user: true,
    };

    constructor(
        @InjectRepository(Order)
        repository: Repository<Order>,
    ) {
        super(repository);
    }

    /**
     * Find orders with filters based on user role
     * Admin sees all orders; regular users see only their own
     */
    async findWithFilters(
        userId: string,
        role: RolesEnum,
        filterDto: OrderFilterDto,
    ): Promise<{ data: Order[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            status,
            dateFrom,
            dateTo,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        } = filterDto;

        const qb = this.repository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'item')
            .leftJoinAndSelect('item.product', 'product')
            .leftJoinAndSelect('order.user', 'user');

        // Non-admin users can only see their own orders
        if (role !== RolesEnum.ADMIN) {
            qb.where('order.userId = :userId', { userId });
        }

        if (status) {
            qb.andWhere('order.status = :status', { status });
        }

        if (dateFrom) {
            qb.andWhere('order.createdAt >= :dateFrom', { dateFrom });
        }

        if (dateTo) {
            qb.andWhere('order.createdAt <= :dateTo', { dateTo });
        }

        const allowedSortFields = ['createdAt', 'totalAmount', 'status'];
        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        qb.orderBy(`order.${safeSortBy}`, sortOrder);

        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return { data, total };
    }

    /**
     * Find order by ID with items and products loaded
     */
    async findWithItems(id: string): Promise<Order | null> {
        return this.repository.findOne({
            where: { id },
            relations: {
                items: { product: true },
                user: true,
            },
        });
    }

    /**
     * Find order by tracking ID
     */
    async findByTrackingId(trackingId: string): Promise<Order | null> {
        return this.repository.findOne({
            where: { trackingId },
            relations: this.defaultRelations,
        });
    }
}
