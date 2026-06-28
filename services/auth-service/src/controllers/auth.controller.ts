import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import type { AuthenticatedRequest } from '../types';

const REFRESH_TOKEN_COOKIE = 'athena_refresh_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { user, tokens } = await this.authService.register(req.body);

      this.setRefreshCookie(res, tokens.refreshToken);

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { user, tokens } = await this.authService.login(req.body);

      this.setRefreshCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const oldRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

      if (!oldRefreshToken) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'No refresh token provided',
        });
        return;
      }

      // We need the userId. Extract it from the access token if present,
      // or look up the user from the hashed refresh token.
      // For simplicity, we require the access token (even expired) in the header.
      const authHeader = req.headers.authorization;
      let userId: string | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = await import('jsonwebtoken');
        try {
          const decoded = jwt.default.decode(authHeader.split(' ')[1]) as { userId?: string } | null;
          userId = decoded?.userId;
        } catch {
          // Token can't be decoded
        }
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Unable to identify user for token refresh',
        });
        return;
      }

      const tokens = await this.authService.refreshTokens(
        oldRefreshToken,
        userId
      );

      this.setRefreshCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.authService.forgotPassword(req.body);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.authService.resetPassword(req.body);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.params.token as string;
      const user = await this.authService.verifyEmail(token);

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
        return;
      }

      const user = await this.authService.getProfile(req.user.userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/api/auth',
    });
  }
}
