import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChaosConfigService } from '@modules/chaos/services/chaos-config.service';

export interface GatewayChargeResult {
    success: boolean;
    transactionId: string | null;
    errorCode: string | null;
    message: string;
    processingTime: number;
}

@Injectable()
export class PaymentGatewayService {
    constructor(private readonly chaosConfigService: ChaosConfigService) {}

    /**
     * Simulate an external payment gateway charge
     */
    async charge(
        amount: number,
        correlationId: string,
    ): Promise<GatewayChargeResult> {
        const config = this.chaosConfigService.getPaymentGatewayConfig();

        // Calculate random latency
        const latency = this.chaosConfigService.getRandomLatency(
            config.latencyMs.min,
            config.latencyMs.max,
        );

        const startTime = Date.now();

        // Simulate gateway processing delay
        await new Promise<void>((resolve) => setTimeout(resolve, latency));

        // Check if should timeout
        if (this.chaosConfigService.shouldTimeout(config.timeoutRate)) {
            throw new Error('Payment gateway timed out');
        }

        // Check if should fail
        if (this.chaosConfigService.shouldFail(config.failureRate)) {
            return {
                success: false,
                transactionId: null,
                errorCode: 'GATEWAY_ERROR',
                message: 'Payment declined',
                processingTime: Date.now() - startTime,
            };
        }

        // Success
        return {
            success: true,
            transactionId: randomUUID(),
            errorCode: null,
            message: 'Payment approved',
            processingTime: Date.now() - startTime,
        };
    }
}
