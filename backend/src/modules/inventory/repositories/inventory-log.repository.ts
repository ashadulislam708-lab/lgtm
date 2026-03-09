import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base';
import { InventoryLog } from '../entities/inventory-log.entity';

@Injectable()
export class InventoryLogRepository extends BaseRepository<InventoryLog> {
    constructor(
        @InjectRepository(InventoryLog)
        repository: Repository<InventoryLog>,
    ) {
        super(repository);
    }

    /**
     * Find inventory logs for a specific product with pagination
     */
    async findByProductId(
        productId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: InventoryLog[]; total: number }> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.repository
            .createQueryBuilder('log')
            .where('log.productId = :productId', { productId })
            .orderBy('log.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return { data, total };
    }

    /**
     * Create an inventory log entry
     */
    async createLog(data: Partial<InventoryLog>): Promise<InventoryLog> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    /**
     * Find all logs from a specific sync operation
     */
    async findBySyncCorrelationId(
        syncCorrelationId: string,
    ): Promise<InventoryLog[]> {
        return this.repository
            .createQueryBuilder('log')
            .where('log.syncCorrelationId = :syncCorrelationId', {
                syncCorrelationId,
            })
            .leftJoinAndSelect('log.product', 'product')
            .orderBy('log.createdAt', 'DESC')
            .getMany();
    }
}
