import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtAccessPayload } from '../types';

/**
 * Verify an access token issued by the auth-service.
 * The document-service only verifies tokens — it never signs them.
 */
export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'athena-auth',
    audience: 'athena-web',
  }) as JwtAccessPayload;
}
