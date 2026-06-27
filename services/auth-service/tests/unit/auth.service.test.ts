import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from '../../src/services/auth.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { TokenService } from '../../src/services/token.service';
import { EmailService } from '../../src/services/email.service';

// Mock dependencies
vi.mock('bcrypt');

const mockUser = {
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  role: 'student' as const,
  isVerified: false,
  verificationToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMocks() {
  const userRepo = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByVerificationToken: vi.fn(),
    findByResetToken: vi.fn(),
    create: vi.fn(),
    updateVerificationStatus: vi.fn(),
    setPasswordResetToken: vi.fn(),
    updatePassword: vi.fn(),
    emailExists: vi.fn(),
  } as unknown as UserRepository;

  const tokenService = {
    generateTokenPair: vi.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
    rotateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllUserTokens: vi.fn(),
  } as unknown as TokenService;

  const emailService = {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  } as unknown as EmailService;

  return { userRepo, tokenService, emailService };
}

describe('AuthService', () => {
  let authService: AuthService;
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    authService = new AuthService(
      mocks.userRepo,
      mocks.tokenService,
      mocks.emailService
    );
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      (mocks.userRepo.emailExists as any).mockResolvedValue(false);
      (mocks.userRepo.create as any).mockResolvedValue(mockUser);
      (bcrypt.hash as any).mockResolvedValue('$2b$12$hashedpassword');

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(mocks.emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      (mocks.userRepo.emailExists as any).mockResolvedValue(true);

      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('An account with this email already exists');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      (mocks.userRepo.findByEmail as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('should throw UnauthorizedError for invalid email', async () => {
      (mocks.userRepo.findByEmail as any).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      (mocks.userRepo.findByEmail as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword1',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email for existing user', async () => {
      (mocks.userRepo.findByEmail as any).mockResolvedValue(mockUser);
      (mocks.userRepo.setPasswordResetToken as any).mockResolvedValue(mockUser);

      await authService.forgotPassword({ email: 'test@example.com' });

      expect(mocks.emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should silently succeed for non-existent email (prevent enumeration)', async () => {
      (mocks.userRepo.findByEmail as any).mockResolvedValue(null);

      await expect(
        authService.forgotPassword({ email: 'nobody@example.com' })
      ).resolves.toBeUndefined();

      expect(mocks.emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      (mocks.userRepo.findByVerificationToken as any).mockResolvedValue(
        mockUser
      );
      const verifiedUser = { ...mockUser, isVerified: true };
      (mocks.userRepo.updateVerificationStatus as any).mockResolvedValue(
        verifiedUser
      );

      const result = await authService.verifyEmail('valid-token');

      expect(result.isVerified).toBe(true);
    });

    it('should throw BadRequestError for invalid token', async () => {
      (mocks.userRepo.findByVerificationToken as any).mockResolvedValue(null);

      await expect(authService.verifyEmail('bad-token')).rejects.toThrow(
        'Invalid or expired verification token'
      );
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      await authService.logout('some-refresh-token');

      expect(mocks.tokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'some-refresh-token'
      );
    });
  });
});
