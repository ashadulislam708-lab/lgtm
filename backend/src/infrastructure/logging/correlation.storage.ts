import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
    correlationId: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string | undefined {
    return requestContextStorage.getStore()?.correlationId;
}
