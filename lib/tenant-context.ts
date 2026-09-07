import { AsyncLocalStorage } from 'node:async_hooks';

export const tenantStorage = new AsyncLocalStorage<string>();

/**
 * Run a callback function within a specific tenant context.
 */
export function runWithTenant<T>(companyId: string, fn: () => T): T {
  return tenantStorage.run(companyId, fn);
}

/**
 * Get the currently active tenant companyId from the async execution context.
 */
export function getCurrentTenant(): string | undefined {
  return tenantStorage.getStore();
}

/**
 * Set the currently active tenant companyId for the remainder of the execution chain.
 */
export function setCurrentTenant(companyId: string): void {
  tenantStorage.enterWith(companyId);
}
