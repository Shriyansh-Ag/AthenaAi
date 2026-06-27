import crypto from 'crypto';
import { TokenRepository } from '../repositories/token.repository';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/jwt';
import { UnauthorizedError } from '../utils/app-error';
import type { JwtAccessPayload, AuthTokens } from '../types';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_SESSIONS_PER_USER = 5;

export class TokenService {
  constructor(private tokenRepository: TokenRepository) {}

  async generateTokenPair(payload: JwtAccessPayload): Promise<AuthTokens> {
    const accessToken = signAccessToken(payload);

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    // Enforce max sessions: delete oldest if over limit
    const sessionCount = await this.tokenRepository.countForUser(payload.userId);
    if (sessionCount >= MAX_SESSIONS_PER_USER) {
      await this.tokenRepository.deleteAllForUser(payload.userId);
    }

    const tokenId = crypto.randomUUID();
    const refreshTokenJwt = signRefreshToken({
      userId: payload.userId,
      tokenId,
    });

    await this.tokenRepository.create(
      payload.userId,
      rawRefreshToken,
      expiresAt
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async rotateRefreshToken(
    oldRawToken: string,
    userPayload: JwtAccessPayload
  ): Promise<AuthTokens> {
    const oldHash = hashToken(oldRawToken);
    const existingToken = await this.tokenRepository.findByTokenHash(oldHash);

    if (!existingToken) {
      // Possible token reuse attack — revoke all sessions for this user
      await this.tokenRepository.deleteAllForUser(userPayload.userId);
      throw new UnauthorizedError(
        'Refresh token not recognized. All sessions revoked for security.'
      );
    }

    if (existingToken.expiresAt < new Date()) {
      await this.tokenRepository.deleteByTokenHash(oldHash);
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Delete the used token (rotation)
    await this.tokenRepository.deleteByTokenHash(oldHash);

    // Issue new pair
    return this.generateTokenPair(userPayload);
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.tokenRepository.deleteByTokenHash(tokenHash);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepository.deleteAllForUser(userId);
  }
}
