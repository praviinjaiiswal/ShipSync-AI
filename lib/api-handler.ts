/**
 * API Route Handler Wrapper — centralized error handling, tenant context, and RBAC.
 * 
 * Every API route MUST be wrapped with this handler. It:
 * 1. Generates a unique requestId for log correlation
 * 2. Catches all thrown errors and maps to correct HTTP status
 * 3. Returns consistent JSON shape: { error: { code, message, requestId } }
 * 4. NEVER leaks stack traces, SQL, or internal paths to client
 * 5. Logs full error details server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError, ValidationError, AuthError, RateLimitError } from '@/lib/errors';

type RouteHandler<T = any> = (
  req: NextRequest,
  context: { params: T }
) => Promise<NextResponse | Response>;

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Wrap an API route handler with centralized error handling.
 */
export function withErrorHandler<T = any>(handler: RouteHandler<T>): RouteHandler<T> {
  return async (req: NextRequest, context: { params: T }) => {
    const requestId = generateRequestId();

    try {
      return await handler(req, context);
    } catch (error: unknown) {
      // Re-throw Next.js dynamic server usage error so Next prerendering marks route as dynamic
      if ((error as any)?.digest === 'DYNAMIC_SERVER_USAGE') {
        throw error;
      }

      // Known application errors
      if (error instanceof AppError) {
        const headers: Record<string, string> = {};

        if (error instanceof RateLimitError) {
          headers['Retry-After'] = String(error.retryAfter);
        }

        // Log with requestId for correlation
        console.error(`[${requestId}] ${error.name}: ${error.message}`, {
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        });

        const responseBody: Record<string, unknown> = {
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
        };

        // Include field-level details for validation errors (safe to expose)
        if (error instanceof ValidationError && error.details) {
          (responseBody.error as Record<string, unknown>).details = error.details;
        }

        return NextResponse.json(responseBody, {
          status: error.statusCode,
          headers,
        });
      }

      // Zod validation errors (from safeParse failures thrown directly)
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error(`[${requestId}] ZodError:`, error);
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: error,
              requestId,
            },
          },
          { status: 400 }
        );
      }

      // Unknown/unexpected errors — NEVER leak details to client
      console.error(`[${requestId}] Unhandled error:`, error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            requestId,
          },
        },
        { status: 500 }
      );
    }
  };
}
