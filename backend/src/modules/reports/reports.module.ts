import { Module } from '@nestjs/common';
import { QueueModule } from '@infrastructure/queue/queue.module';
import { I18nHelper } from '@core/utils/i18n.helper';
import { ReportService } from './services/report.service';
import { ReportProcessor } from './processors/report.processor';
import { ReportController } from './controllers/report.controller';

@Module({
    imports: [QueueModule],
    controllers: [ReportController],
    providers: [ReportService, ReportProcessor, I18nHelper],
    exports: [ReportService],
})
export class ReportsModule {}
