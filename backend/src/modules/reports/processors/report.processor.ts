import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants';
import { ReportService } from '../services/report.service';
import { ReportTypeEnum } from '../dto/generate-report.dto';

interface ReportJobData {
    type: ReportTypeEnum;
    dateFrom: string;
    dateTo: string;
    jobId: string;
}

@Processor(QUEUE_NAMES.REPORT_GENERATION)
export class ReportProcessor extends WorkerHost {
    private readonly logger = new Logger(ReportProcessor.name);

    constructor(private readonly reportService: ReportService) {
        super();
    }

    async process(job: Job<ReportJobData>): Promise<any> {
        const { type, dateFrom, dateTo, jobId } = job.data;

        this.logger.log(
            `Processing report job ${jobId}: type=${type}, range=${dateFrom} to ${dateTo}`,
        );

        try {
            const dateFromObj = new Date(dateFrom);
            const dateToObj = new Date(dateTo);

            const data = await this.reportService.generateReportByType(
                type,
                dateFromObj,
                dateToObj,
            );

            // Store the result in the service's in-memory map
            this.reportService.storeReportResult(jobId, data);

            this.logger.log(`Report job ${jobId} completed successfully`);

            return data;
        } catch (error) {
            this.logger.error(
                `Report job ${jobId} failed: ${(error as Error).message}`,
            );
            throw error;
        }
    }
}
