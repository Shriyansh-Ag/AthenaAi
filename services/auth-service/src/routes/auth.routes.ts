import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { EmailService } from '../services/email.service';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middleware/rate-limit';
import {
  registerDto,
  loginDto,
  forgotPasswordDto,
  resetPasswordDto,
} from '../dtos/auth.dto';

// ── Dependency Injection (Manual, Composition Root) ──────────────────────
const userRepository = new UserRepository();
const tokenRepository = new TokenRepository();
const emailService = new EmailService();
const tokenService = new TokenService(tokenRepository);
const authService = new AuthService(userRepository, tokenService, emailService);
const authController = new AuthController(authService);

// ── Route Definitions ────────────────────────────────────────────────────
const router: Router = Router();

// Public routes (rate-limited)
router.post(
  '/register',
  authLimiter,
  validate(registerDto),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginDto),
  authController.login
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordDto),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordDto),
  authController.resetPassword
);

router.get('/verify-email/:token', authController.verifyEmail);

// Cookie-based (no auth header required)
router.post('/refresh', authController.refresh);

// Authenticated routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', version: '0.1.0' });
});

export { router as authRoutes };
