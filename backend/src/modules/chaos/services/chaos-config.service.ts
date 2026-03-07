import { Injectable, Logger } from '@nestjs/common';
import {
    ChaosConfig,
    DEFAULT_CHAOS_CONFIG,
    PaymentGatewayConfig,
    WarehouseApiConfig,
} from '../interfaces/chaos-config.interface';

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

@Injectable()
export class ChaosConfigService {
    private readonly logger = new Logger(ChaosConfigService.name);
    private config: ChaosConfig;

    constructor() {
        this.config = this.deepClone(DEFAULT_CHAOS_CONFIG);
    }

    getConfig(): ChaosConfig {
        return this.deepClone(this.config);
    }

    setConfig(partial: DeepPartial<ChaosConfig>): ChaosConfig {
        this.config = this.deepMerge(this.config, partial);
        this.logger.warn(
            `Chaos config updated: ${JSON.stringify(this.config)}`,
        );
        return this.deepClone(this.config);
    }

    reset(): ChaosConfig {
        this.config = this.deepClone(DEFAULT_CHAOS_CONFIG);
        this.logger.warn('Chaos config reset to defaults');
        return this.deepClone(this.config);
    }

    getPaymentGatewayConfig(): PaymentGatewayConfig {
        return this.deepClone(this.config.paymentGateway);
    }

    getWarehouseApiConfig(): WarehouseApiConfig {
        return this.deepClone(this.config.warehouseApi);
    }

    shouldFail(failureRate: number): boolean {
        return Math.random() < failureRate;
    }

    getRandomLatency(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    shouldTimeout(timeoutRate: number): boolean {
        return Math.random() < timeoutRate;
    }

    private deepClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    private deepMerge<T extends Record<string, any>>(
        target: T,
        source: DeepPartial<T>,
    ): T {
        const result = { ...target };

        for (const key of Object.keys(source) as Array<keyof T>) {
            const sourceValue = source[key];
            const targetValue = target[key];

            if (
                sourceValue !== undefined &&
                sourceValue !== null &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                typeof targetValue === 'object' &&
                targetValue !== null &&
                !Array.isArray(targetValue)
            ) {
                result[key] = this.deepMerge(
                    targetValue as Record<string, any>,
                    sourceValue as DeepPartial<Record<string, any>>,
                ) as T[keyof T];
            } else if (sourceValue !== undefined) {
                result[key] = sourceValue as T[keyof T];
            }
        }

        return result;
    }
}
