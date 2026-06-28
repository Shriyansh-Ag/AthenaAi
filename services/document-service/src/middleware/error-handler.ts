import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

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

  // Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: fieldErrors,
    });
    return;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    const multerErr = err as Error & { code?: string };
    let message = err.message;
    let statusCode = 400;

    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the allowed limit';
      statusCode = 413;
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }

    res.status(statusCode).json({
      success: false,
      code: 'UPLOAD_ERROR',
      message,
    });
    return;
  }

  // Multer file filter errors (thrown as regular Error, not MulterError)
  if (err.message && err.message.startsWith('Unsupported file type')) {
    res.status(415).json({
      success: false,
      code: 'UNSUPPORTED_MEDIA_TYPE',
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

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      code: 'BAD_REQUEST',
      message: 'Invalid document ID format',
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
