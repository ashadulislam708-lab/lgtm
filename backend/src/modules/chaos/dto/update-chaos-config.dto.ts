import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNumber,
    IsOptional,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

class LatencyRangeDto {
    @ApiPropertyOptional({ example: 500, description: 'Minimum latency in ms' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    min?: number;

    @ApiPropertyOptional({ example: 2000, description: 'Maximum latency in ms' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    max?: number;
}

class PaymentGatewayConfigDto {
    @ApiPropertyOptional({ type: LatencyRangeDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LatencyRangeDto)
    latencyMs?: LatencyRangeDto;

    @ApiPropertyOptional({ example: 0.2, description: 'Failure rate (0-1)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    failureRate?: number;

    @ApiPropertyOptional({ example: 0.1, description: 'Timeout rate (0-1)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    timeoutRate?: number;
}

class WarehouseApiConfigDto {
    @ApiPropertyOptional({ type: LatencyRangeDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LatencyRangeDto)
    latencyMs?: LatencyRangeDto;

    @ApiPropertyOptional({ example: 0.1, description: 'Timeout rate (0-1)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    timeoutRate?: number;
}

class DatabaseChaosConfigDto {
    @ApiPropertyOptional({ example: false, description: 'Enable slow query simulation' })
    @IsOptional()
    @IsBoolean()
    slowQueryEnabled?: boolean;

    @ApiPropertyOptional({ example: 0, description: 'Slow query delay in ms' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    slowQueryDelayMs?: number;
}

class QueueSlowConsumerConfigDto {
    @ApiPropertyOptional({ example: false, description: 'Enable slow consumer simulation' })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiPropertyOptional({ example: 0, description: 'Consumer delay in ms' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    delayMs?: number;
}

export class UpdateChaosConfigDto {
    @ApiPropertyOptional({ type: PaymentGatewayConfigDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => PaymentGatewayConfigDto)
    paymentGateway?: PaymentGatewayConfigDto;

    @ApiPropertyOptional({ type: WarehouseApiConfigDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => WarehouseApiConfigDto)
    warehouseApi?: WarehouseApiConfigDto;

    @ApiPropertyOptional({ type: DatabaseChaosConfigDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DatabaseChaosConfigDto)
    database?: DatabaseChaosConfigDto;

    @ApiPropertyOptional({ type: QueueSlowConsumerConfigDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => QueueSlowConsumerConfigDto)
    queueSlowConsumer?: QueueSlowConsumerConfigDto;
}
