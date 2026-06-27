import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../../src/services/token.service';
import { TokenRepository } from '../../src/repositories/token.repository';

const mockTokenRepo = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  deleteByTokenHash: vi.fn(),
  deleteAllForUser: vi.fn(),
  countForUser: vi.fn(),
} as unknown as TokenRepository;

// We need to mock the env module before TokenService uses it
vi.mock('../../src/config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test-access-secret-long-enough',
    JWT_REFRESH_SECRET: 'test-refresh-secret-long-enough',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
  },
}));

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenService = new TokenService(mockTokenRepo);
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      (mockTokenRepo.countForUser as any).mockResolvedValue(0);
      (mockTokenRepo.create as any).mockResolvedValue({});

      const result = await tokenService.generateTokenPair({
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'student',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should clear old sessions when max limit reached', async () => {
      (mockTokenRepo.countForUser as any).mockResolvedValue(5);
      (mockTokenRepo.create as any).mockResolvedValue({});

      await tokenService.generateTokenPair({
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'student',
      });

      expect(mockTokenRepo.deleteAllForUser).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('should revoke all sessions on token reuse detection', async () => {
      (mockTokenRepo.findByTokenHash as any).mockResolvedValue(null);

      await expect(
        tokenService.rotateRefreshToken('stolen-token', {
          userId: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          role: 'student',
        })
      ).rejects.toThrow('All sessions revoked');

      expect(mockTokenRepo.deleteAllForUser).toHaveBeenCalled();
    });

    it('should rotate successfully with valid token', async () => {
      const validToken = {
        userId: '507f1f77bcf86cd799439011',
        expiresAt: new Date(Date.now() + 86400000), // tomorrow
      };

      (mockTokenRepo.findByTokenHash as any).mockResolvedValue(validToken);
      (mockTokenRepo.deleteByTokenHash as any).mockResolvedValue({});
      (mockTokenRepo.countForUser as any).mockResolvedValue(1);
      (mockTokenRepo.create as any).mockResolvedValue({});

      const result = await tokenService.rotateRefreshToken('valid-token', {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'student',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockTokenRepo.deleteByTokenHash).toHaveBeenCalled();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should delete the token by hash', async () => {
      (mockTokenRepo.deleteByTokenHash as any).mockResolvedValue({});

      await tokenService.revokeRefreshToken('some-token');

      expect(mockTokenRepo.deleteByTokenHash).toHaveBeenCalled();
    });
  });
});
