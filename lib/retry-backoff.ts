export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}

/**
 * Calculates exponential backoff with jitter.
 */
export function calculateBackoffDelay(
  attempt: number,
  options: RetryOptions = {}
): number {
  const base = options.baseDelayMs ?? 1000;
  const cap = options.maxDelayMs ?? 30000;
  const useJitter = options.jitter ?? true;

  // base * 2^(attempt - 1)
  const exponential = Math.min(cap, base * Math.pow(2, Math.max(0, attempt - 1)));

  if (useJitter) {
    // Full jitter: random value between 0 and exponential
    return Math.floor(Math.random() * exponential);
  }

  return exponential;
}

/**
 * Executes an async operation with automatic retry on failure using exponential backoff.
 */
export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let attempt = 1;

  while (true) {
    try {
      return await fn(attempt);
    } catch (error: any) {
      if (attempt > maxRetries || (shouldRetry && !shouldRetry(error))) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, options);
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
