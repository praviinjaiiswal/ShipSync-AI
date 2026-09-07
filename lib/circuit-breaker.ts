import { CircuitBreakerError } from '@/lib/errors';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold?: number; // Consecutive failures before opening
  cooldownPeriodMs?: number; // Time to wait in OPEN before testing HALF_OPEN
}

interface CircuitStats {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  nextAttemptAllowedAt: number | null;
}

/**
 * Service-level Circuit Breaker to prevent cascade failures against external government APIs
 * (ICEGATE, DGFT, e-Sanchit).
 */
export class CircuitBreaker {
  private stats = new Map<string, CircuitStats>();
  private failureThreshold: number;
  private cooldownPeriodMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownPeriodMs = options.cooldownPeriodMs ?? 60000; // 60 seconds
  }

  private getOrCreateStats(serviceKey: string): CircuitStats {
    let stat = this.stats.get(serviceKey);
    if (!stat) {
      stat = {
        state: 'CLOSED',
        consecutiveFailures: 0,
        lastFailureTime: null,
        nextAttemptAllowedAt: null,
      };
      this.stats.set(serviceKey, stat);
    }
    return stat;
  }

  public getState(serviceKey: string): CircuitState {
    const stat = this.getOrCreateStats(serviceKey);
    const now = Date.now();

    if (stat.state === 'OPEN') {
      if (stat.nextAttemptAllowedAt && now >= stat.nextAttemptAllowedAt) {
        stat.state = 'HALF_OPEN';
      }
    }

    return stat.state;
  }

  public async execute<T>(serviceKey: string, fn: () => Promise<T>): Promise<T> {
    const state = this.getState(serviceKey);
    const stat = this.getOrCreateStats(serviceKey);

    if (state === 'OPEN') {
      const remainingCooldown = Math.max(0, (stat.nextAttemptAllowedAt ?? 0) - Date.now());
      throw new CircuitBreakerError(serviceKey, remainingCooldown);
    }

    try {
      const result = await fn();
      this.recordSuccess(serviceKey);
      return result;
    } catch (error: any) {
      this.recordFailure(serviceKey, error);
      throw error;
    }
  }

  public recordSuccess(serviceKey: string): void {
    const stat = this.getOrCreateStats(serviceKey);
    stat.consecutiveFailures = 0;
    stat.lastFailureTime = null;
    stat.nextAttemptAllowedAt = null;
    stat.state = 'CLOSED';
  }

  public recordFailure(serviceKey: string, _error?: any): void {
    const stat = this.getOrCreateStats(serviceKey);
    const now = Date.now();
    stat.consecutiveFailures += 1;
    stat.lastFailureTime = now;

    if (stat.state === 'HALF_OPEN' || stat.consecutiveFailures >= this.failureThreshold) {
      stat.state = 'OPEN';
      stat.nextAttemptAllowedAt = now + this.cooldownPeriodMs;
    }
  }

  public reset(serviceKey: string): void {
    this.stats.delete(serviceKey);
  }

  public clearAll(): void {
    this.stats.clear();
  }

  public getStats(serviceKey: string): Readonly<CircuitStats> {
    return { ...this.getOrCreateStats(serviceKey) };
  }
}

// Global shared circuit breaker instance
export const globalCircuitBreaker = new CircuitBreaker();
