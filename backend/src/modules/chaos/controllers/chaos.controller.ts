import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import { RolesEnum } from '@shared/enums/role.enum';
import type { ChaosConfig } from '../interfaces/chaos-config.interface';
import { ChaosConfigService } from '../services/chaos-config.service';
import { UpdateChaosConfigDto } from '../dto';

@ApiTags('Chaos')
@Controller('chaos')
@UseGuards(RolesGuard)
export class ChaosController {
    private readonly logger = new Logger(ChaosController.name);

    constructor(private readonly chaosConfigService: ChaosConfigService) {}

    @Get('config')
    @Roles(RolesEnum.ADMIN)
    getConfig(): ChaosConfig {
        return this.chaosConfigService.getConfig();
    }

    @Post('config')
    @Roles(RolesEnum.ADMIN)
    updateConfig(@Body() dto: UpdateChaosConfigDto): ChaosConfig {
        this.logger.warn(`Chaos config update requested: ${JSON.stringify(dto)}`);
        return this.chaosConfigService.setConfig(dto);
    }

    @Post('reset')
    @Roles(RolesEnum.ADMIN)
    resetConfig(): ChaosConfig {
        this.logger.warn('Chaos config reset requested');
        return this.chaosConfigService.reset();
    }
}
