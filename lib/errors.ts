/**
 * Centralized error classes for the ShipSync platform.
 * Every error has a machine-readable `code`, HTTP `statusCode`, and human-safe `message`.
 * Stack traces and internal details are NEVER sent to the client.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class CircuitBreakerError extends AppError {
  public readonly service: string;
  public readonly resetTimeMs: number;

  constructor(service: string, resetTimeMs: number, message = 'Customs gateway circuit breaker is OPEN') {
    super(`${message}: ${service} is temporarily unavailable due to upstream failures. Retry in ${Math.round(resetTimeMs / 1000)}s.`, 'CIRCUIT_BREAKER_OPEN', 503, { service, resetTimeMs });
    this.name = 'CircuitBreakerError';
    this.service = service;
    this.resetTimeMs = resetTimeMs;
    Object.setPrototypeOf(this, CircuitBreakerError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, message = 'Too many requests') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message = 'External service unavailable') {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, { service });
    this.name = 'ExternalServiceError';
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}
