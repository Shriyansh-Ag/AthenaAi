import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import {
  generateSecureToken,
  hashToken,
} from '../utils/jwt';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/app-error';
import type { SafeUser, AuthTokens } from '../types';
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dtos/auth.dto';
import { IUser } from '../models/user.model';

const SALT_ROUNDS = 12;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService,
    private emailService: EmailService
  ) {}

  async register(
    dto: RegisterDto
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const exists = await this.userRepository.emailExists(dto.email);
    if (exists) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const verificationToken = generateSecureToken();
    const verificationTokenHash = hashToken(verificationToken);

    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      verificationToken: verificationTokenHash,
    });

    await this.emailService.sendVerificationEmail(dto.email, verificationToken);

    const tokens = await this.tokenService.generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: this.toSafeUser(user), tokens };
  }

  async login(
    dto: LoginDto
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      // Use generic message to prevent email enumeration
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.tokenService.generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: this.toSafeUser(user), tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async refreshTokens(
    oldRefreshToken: string,
    userId: string
  ): Promise<AuthTokens> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return this.tokenService.rotateRefreshToken(oldRefreshToken, {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!user) return;

    const resetToken = generateSecureToken();
    const resetTokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await this.userRepository.setPasswordResetToken(
      user._id.toString(),
      resetTokenHash,
      expiresAt
    );

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = hashToken(dto.token);
    const user = await this.userRepository.findByResetToken(tokenHash);

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.userRepository.updatePassword(user._id.toString(), passwordHash);

    // Revoke all existing sessions for security
    await this.tokenService.revokeAllUserTokens(user._id.toString());
  }

  async verifyEmail(token: string): Promise<SafeUser> {
    const tokenHash = hashToken(token);
    const user = await this.userRepository.findByVerificationToken(tokenHash);

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    const updatedUser = await this.userRepository.updateVerificationStatus(
      user._id.toString(),
      true
    );

    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return this.toSafeUser(updatedUser);
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.toSafeUser(user);
  }

  private toSafeUser(user: IUser): SafeUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }
}
