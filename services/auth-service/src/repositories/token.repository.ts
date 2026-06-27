import { RefreshToken, IRefreshToken } from '../models/refresh-token.model';
import { hashToken } from '../utils/jwt';

export class TokenRepository {
  async create(
    userId: string,
    rawToken: string,
    expiresAt: Date
  ): Promise<IRefreshToken> {
    const tokenDoc = new RefreshToken({
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt,
    });
    return tokenDoc.save();
  }

  async findByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ tokenHash });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await RefreshToken.deleteOne({ tokenHash });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
  }

  async countForUser(userId: string): Promise<number> {
    return RefreshToken.countDocuments({ userId });
  }
}
