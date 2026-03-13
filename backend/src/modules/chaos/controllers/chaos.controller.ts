import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { ChaosConfig } from '../interfaces/chaos-config.interface';
import { ChaosConfigService } from '../services/chaos-config.service';
import { UpdateChaosConfigDto } from '../dto';

@ApiTags('Chaos')
@Controller('chaos')
export class ChaosController {
    private readonly logger = new Logger(ChaosController.name);

    constructor(private readonly chaosConfigService: ChaosConfigService) {}

    @Get('config')
    getConfig(): ChaosConfig {
        return this.chaosConfigService.getConfig();
    }

    @Post('config')
    updateConfig(@Body() dto: UpdateChaosConfigDto): ChaosConfig {
        this.logger.warn(`Chaos config update requested: ${JSON.stringify(dto)}`);
        return this.chaosConfigService.setConfig(dto);
    }

    @Post('reset')
    resetConfig(): ChaosConfig {
        this.logger.warn('Chaos config reset requested');
        return this.chaosConfigService.reset();
    }
}
