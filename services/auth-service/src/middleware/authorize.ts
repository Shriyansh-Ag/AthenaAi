import { Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/app-error';
import type { AuthenticatedRequest, UserRole } from '../types';

/**
 * Role-based authorization middleware factory.
 * Must be used after the authenticate middleware.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      );
    }

    next();
  };
}
