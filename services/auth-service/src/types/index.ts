import { Request } from 'express';

export interface JwtAccessPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface JwtRefreshPayload {
  userId: string;
  tokenId: string;
}

export type UserRole = 'student' | 'admin';

export interface AuthenticatedRequest extends Request {
  user?: JwtAccessPayload;
}

export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  verificationToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
