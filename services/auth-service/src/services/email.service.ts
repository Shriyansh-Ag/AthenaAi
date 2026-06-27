import { logger } from '../utils/logger';

/**
 * Mock email service.
 *
 * In production this would integrate with SendGrid, SES, or similar.
 * For Sprint 2 MVP, we log the email content to the console so the
 * developer can manually copy verification/reset links.
 */
export class EmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/verify-email?token=${token}`;
    logger.info('━━━ MOCK EMAIL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`To: ${email}`);
    logger.info(`Subject: Verify your AthenaAI account`);
    logger.info(`Verification URL: ${verificationUrl}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/reset-password?token=${token}`;
    logger.info('━━━ MOCK EMAIL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`To: ${email}`);
    logger.info(`Subject: Reset your AthenaAI password`);
    logger.info(`Reset URL: ${resetUrl}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
