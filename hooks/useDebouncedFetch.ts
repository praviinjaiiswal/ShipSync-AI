'use client';

import { useState, useEffect, useRef } from 'react';

interface UseDebouncedFetchOptions {
  delay?: number;
  enabled?: boolean;
}

interface UseDebouncedFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  cancel: () => void;
}

export function useDebouncedFetch<T = unknown>(
  url: string | null,
  options: UseDebouncedFetchOptions = {}
): UseDebouncedFetchResult<T> {
  const { delay = 400, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!url || !enabled) {
      cancel();
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      // Cancel previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `Request failed with status ${res.status}`);
        }
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Silently ignore aborts
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, delay, enabled]);

  return { data, isLoading, error, cancel };
}
