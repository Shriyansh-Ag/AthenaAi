import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

/**
 * Centralized error handler.
 * Converts known AppError instances to structured JSON responses.
 * Catches unknown errors as 500 Internal Server Error without leaking stack traces.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as Error & { code?: number }).code === 11000) {
    res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: 'Resource already exists',
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: err.message,
    });
    return;
  }

  // Unknown errors — log full stack, return generic message
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  });
}
