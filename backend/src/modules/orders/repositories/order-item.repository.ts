import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository.js';
import { OrderItem } from '../entities/order-item.entity.js';

@Injectable()
export class OrderItemRepository extends BaseRepository<OrderItem> {
    constructor(
        @InjectRepository(OrderItem)
        repository: Repository<OrderItem>,
    ) {
        super(repository);
    }

    /**
     * Find all items for a given order
     */
    async findByOrderId(orderId: string): Promise<OrderItem[]> {
        return this.repository.find({
            where: { orderId },
            relations: { product: true },
        });
    }

    /**
     * Bulk create multiple order items
     */
    async bulkCreate(items: Partial<OrderItem>[]): Promise<OrderItem[]> {
        const entities = this.repository.create(items);
        return this.repository.save(entities);
    }
}
