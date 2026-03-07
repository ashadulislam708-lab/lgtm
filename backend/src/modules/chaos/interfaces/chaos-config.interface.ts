export interface PaymentGatewayConfig {
    latencyMs: { min: number; max: number };
    failureRate: number;
    timeoutRate: number;
}

export interface WarehouseApiConfig {
    latencyMs: { min: number; max: number };
    timeoutRate: number;
}

export interface DatabaseChaosConfig {
    slowQueryEnabled: boolean;
    slowQueryDelayMs: number;
}

export interface QueueSlowConsumerConfig {
    enabled: boolean;
    delayMs: number;
}

export interface ChaosConfig {
    paymentGateway: PaymentGatewayConfig;
    warehouseApi: WarehouseApiConfig;
    database: DatabaseChaosConfig;
    queueSlowConsumer: QueueSlowConsumerConfig;
}

export const DEFAULT_CHAOS_CONFIG: ChaosConfig = {
    paymentGateway: {
        latencyMs: { min: 500, max: 2000 },
        failureRate: 0.2,
        timeoutRate: 0.1,
    },
    warehouseApi: {
        latencyMs: { min: 200, max: 1500 },
        timeoutRate: 0.1,
    },
    database: {
        slowQueryEnabled: false,
        slowQueryDelayMs: 0,
    },
    queueSlowConsumer: {
        enabled: false,
        delayMs: 0,
    },
};
