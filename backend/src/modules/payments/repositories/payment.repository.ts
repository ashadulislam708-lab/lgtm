import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentRepository extends BaseRepository<Payment> {
    constructor(
        @InjectRepository(Payment)
        repository: Repository<Payment>,
    ) {
        super(repository);
    }

    /**
     * Find all payments for an order, ordered by attemptNumber descending
     */
    async findByOrderId(orderId: string): Promise<Payment[]> {
        return this.repository.find({
            where: { orderId },
            order: { attemptNumber: 'DESC' },
        });
    }

    /**
     * Get the most recent payment for an order
     */
    async getLatestByOrderId(orderId: string): Promise<Payment | null> {
        return this.repository.findOne({
            where: { orderId },
            order: { attemptNumber: 'DESC' },
        });
    }

    /**
     * Create a new payment record
     */
    async createPayment(data: DeepPartial<Payment>): Promise<Payment> {
        const payment = this.repository.create(data);
        return this.repository.save(payment);
    }
}
