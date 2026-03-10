import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { I18nHelper } from '@core/utils/i18n.helper';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants';
import { GenerateReportDto, ReportTypeEnum } from '../dto/generate-report.dto';

interface ReportResult {
    status: string;
    data: any;
    generatedAt: Date;
}

@Injectable()
export class ReportService {
    private readonly logger = new Logger(ReportService.name);
    private readonly reportStore = new Map<string, ReportResult>();

    constructor(
        private readonly dataSource: DataSource,
        private readonly i18nHelper: I18nHelper,
        @InjectQueue(QUEUE_NAMES.REPORT_GENERATION)
        private readonly reportQueue: Queue,
    ) {}

    /**
     * Generate a report inline or enqueue for async processing
     */
    async generateReport(dto: GenerateReportDto): Promise<{
        jobId: string;
        status: string;
        data?: any;
        message: string;
    }> {
        const dateFrom = new Date(dto.dateFrom);
        const dateTo = new Date(dto.dateTo);
        const diffDays = (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24);

        const jobId = uuidv4();

        if (diffDays < 7) {
            // Generate inline with intentional delay
            const data = await this.generateReportByType(dto.type, dateFrom, dateTo);

            this.reportStore.set(jobId, {
                status: 'completed',
                data,
                generatedAt: new Date(),
            });

            return {
                jobId,
                status: 'completed',
                data,
                message: this.i18nHelper.t('translation.reports.success.generated'),
            };
        }

        // Enqueue for async processing
        await this.reportQueue.add('generate-report', {
            type: dto.type,
            dateFrom: dto.dateFrom,
            dateTo: dto.dateTo,
            jobId,
        });

        return {
            jobId,
            status: 'processing',
            message: this.i18nHelper.t('translation.reports.success.enqueued'),
        };
    }

    /**
     * Get the status and result of a report job
     */
    async getReportStatus(jobId: string): Promise<{
        jobId: string;
        status: string;
        data?: any;
        generatedAt?: Date;
        message: string;
    }> {
        // Check in-memory store first
        const stored = this.reportStore.get(jobId);
        if (stored) {
            return {
                jobId,
                status: stored.status,
                data: stored.data,
                generatedAt: stored.generatedAt,
                message: this.i18nHelper.t('translation.reports.success.retrieved'),
            };
        }

        // Check BullMQ job status
        const jobs = await this.reportQueue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed']);
        const job = jobs.find((j) => j.data?.jobId === jobId);

        if (job) {
            const state = await job.getState();

            if (state === 'completed') {
                return {
                    jobId,
                    status: 'completed',
                    data: job.returnvalue,
                    message: this.i18nHelper.t('translation.reports.success.retrieved'),
                };
            }

            if (state === 'failed') {
                return {
                    jobId,
                    status: 'failed',
                    message: this.i18nHelper.t('translation.reports.error.generation_failed'),
                };
            }

            return {
                jobId,
                status: 'processing',
                message: this.i18nHelper.t('translation.reports.success.enqueued'),
            };
        }

        throw new NotFoundException(
            this.i18nHelper.t('translation.reports.error.not_found'),
        );
    }

    /**
     * Store a completed report result (used by the processor)
     */
    storeReportResult(jobId: string, data: any): void {
        this.reportStore.set(jobId, {
            status: 'completed',
            data,
            generatedAt: new Date(),
        });
    }

    /**
     * Generate report by type with intentional delay for observability testing
     */
    async generateReportByType(type: ReportTypeEnum, dateFrom: Date, dateTo: Date): Promise<any> {
        // Intentional delay: 2-5 seconds for observability testing
        await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));

        switch (type) {
            case ReportTypeEnum.SALES:
                return this.generateSalesReport(dateFrom, dateTo);
            case ReportTypeEnum.ORDERS:
                return this.generateOrdersReport(dateFrom, dateTo);
            case ReportTypeEnum.INVENTORY:
                return this.generateInventoryReport(dateFrom, dateTo);
            default:
                throw new NotFoundException(
                    this.i18nHelper.t('translation.reports.error.invalid_type'),
                );
        }
    }

    /**
     * Sales Report: Order + Payment aggregation
     */
    private async generateSalesReport(dateFrom: Date, dateTo: Date): Promise<any> {
        const orderStats = await this.dataSource
            .createQueryBuilder()
            .select('COUNT(*)', 'totalOrders')
            .addSelect('COALESCE(SUM(o.total_amount), 0)', 'totalRevenue')
            .addSelect('COALESCE(AVG(o.total_amount), 0)', 'avgOrderValue')
            .from('orders', 'o')
            .where('o.created_at >= :dateFrom', { dateFrom })
            .andWhere('o.created_at <= :dateTo', { dateTo })
            .getRawOne();

        const ordersByStatus = await this.dataSource
            .createQueryBuilder()
            .select('o.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .from('orders', 'o')
            .where('o.created_at >= :dateFrom', { dateFrom })
            .andWhere('o.created_at <= :dateTo', { dateTo })
            .groupBy('o.status')
            .getRawMany();

        const paymentStats = await this.dataSource
            .createQueryBuilder()
            .select('COUNT(*)', 'totalPayments')
            .addSelect(
                'SUM(CASE WHEN p.status = :paid THEN 1 ELSE 0 END)',
                'successfulPayments',
            )
            .addSelect(
                'SUM(CASE WHEN p.status = :failed THEN 1 ELSE 0 END)',
                'failedPayments',
            )
            .from('payments', 'p')
            .where('p.created_at >= :dateFrom', { dateFrom })
            .andWhere('p.created_at <= :dateTo', { dateTo })
            .setParameter('paid', 'paid')
            .setParameter('failed', 'failed')
            .getRawOne();

        const totalPayments = parseInt(paymentStats?.totalPayments || '0', 10);
        const successfulPayments = parseInt(paymentStats?.successfulPayments || '0', 10);

        return {
            reportType: 'sales',
            dateRange: { from: dateFrom, to: dateTo },
            totalRevenue: parseFloat(orderStats?.totalRevenue || '0'),
            totalOrders: parseInt(orderStats?.totalOrders || '0', 10),
            avgOrderValue: parseFloat(parseFloat(orderStats?.avgOrderValue || '0').toFixed(2)),
            ordersByStatus,
            paymentSuccessRate: totalPayments > 0
                ? parseFloat(((successfulPayments / totalPayments) * 100).toFixed(2))
                : 0,
            totalPayments,
            successfulPayments,
            failedPayments: parseInt(paymentStats?.failedPayments || '0', 10),
        };
    }

    /**
     * Orders Report: Status distribution, trends, top products
     */
    private async generateOrdersReport(dateFrom: Date, dateTo: Date): Promise<any> {
        const statusDistribution = await this.dataSource
            .createQueryBuilder()
            .select('o.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(o.total_amount), 0)', 'totalAmount')
            .from('orders', 'o')
            .where('o.created_at >= :dateFrom', { dateFrom })
            .andWhere('o.created_at <= :dateTo', { dateTo })
            .groupBy('o.status')
            .getRawMany();

        const dailyTrend = await this.dataSource
            .createQueryBuilder()
            .select('DATE(o.created_at)', 'date')
            .addSelect('COUNT(*)', 'orderCount')
            .addSelect('COALESCE(SUM(o.total_amount), 0)', 'revenue')
            .from('orders', 'o')
            .where('o.created_at >= :dateFrom', { dateFrom })
            .andWhere('o.created_at <= :dateTo', { dateTo })
            .groupBy('DATE(o.created_at)')
            .orderBy('DATE(o.created_at)', 'ASC')
            .getRawMany();

        const avgOrderValue = await this.dataSource
            .createQueryBuilder()
            .select('COALESCE(AVG(o.total_amount), 0)', 'avgValue')
            .from('orders', 'o')
            .where('o.created_at >= :dateFrom', { dateFrom })
            .andWhere('o.created_at <= :dateTo', { dateTo })
            .getRawOne();

        const topProducts = await this.dataSource
            .createQueryBuilder()
            .select('p.name', 'productName')
            .addSelect('SUM(oi.quantity)', 'totalQuantity')
            .addSelect('SUM(oi.quantity * oi.unit_price)', 'totalRevenue')
            .from('order_items', 'oi')
            .innerJoin('orders', 'o', 'o.id = oi.order_id')
            .innerJoin('products', 'p', 'p.id = oi.product_id')
            .where('o.created_at >= :dateFrom', { dateFrom })
            .andWhere('o.created_at <= :dateTo', { dateTo })
            .groupBy('p.name')
            .orderBy('SUM(oi.quantity)', 'DESC')
            .limit(10)
            .getRawMany();

        return {
            reportType: 'orders',
            dateRange: { from: dateFrom, to: dateTo },
            statusDistribution,
            dailyTrend,
            avgOrderValue: parseFloat(parseFloat(avgOrderValue?.avgValue || '0').toFixed(2)),
            topProducts,
        };
    }

    /**
     * Inventory Report: Stock levels, low stock alerts, sync history
     */
    private async generateInventoryReport(dateFrom: Date, dateTo: Date): Promise<any> {
        const stockLevels = await this.dataSource
            .createQueryBuilder()
            .select('p.id', 'productId')
            .addSelect('p.name', 'productName')
            .addSelect('p.sku', 'sku')
            .addSelect('p.category', 'category')
            .addSelect('p.stock_quantity', 'stockQuantity')
            .from('products', 'p')
            .where('p.is_active = :isActive', { isActive: true })
            .orderBy('p.stock_quantity', 'ASC')
            .getRawMany();

        const lowStockProducts = stockLevels.filter(
            (p: any) => parseInt(p.stockQuantity, 10) < 10,
        );

        const recentSyncs = await this.dataSource
            .createQueryBuilder()
            .select('il.sync_correlation_id', 'syncCorrelationId')
            .addSelect('il.source', 'source')
            .addSelect('COUNT(*)', 'itemsAffected')
            .addSelect('MIN(il.created_at)', 'syncDate')
            .addSelect('SUM(ABS(COALESCE(il.discrepancy, 0)))', 'totalDiscrepancy')
            .from('inventory_logs', 'il')
            .where('il.created_at >= :dateFrom', { dateFrom })
            .andWhere('il.created_at <= :dateTo', { dateTo })
            .andWhere('il.sync_correlation_id IS NOT NULL')
            .groupBy('il.sync_correlation_id')
            .addGroupBy('il.source')
            .orderBy('MIN(il.created_at)', 'DESC')
            .limit(20)
            .getRawMany();

        return {
            reportType: 'inventory',
            dateRange: { from: dateFrom, to: dateTo },
            totalProducts: stockLevels.length,
            stockLevels,
            lowStockProducts,
            lowStockCount: lowStockProducts.length,
            recentSyncs,
        };
    }
}
