import crypto from 'crypto';
import { ALLOWED_MIME_SET, MAGIC_BYTES } from '../config/mime-types';

/**
 * Check if a MIME type is allowed.
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_SET.has(mimeType);
}

/**
 * Verify file content matches declared MIME type by checking magic bytes.
 * Returns true if the file header matches, or if no magic byte signature
 * is defined for that type (text-based formats like .txt, .md, .csv).
 */
export function verifyMagicBytes(mimeType: string, buffer: Buffer): boolean {
  const signatures = MAGIC_BYTES[mimeType];

  // No magic byte check for text formats — they don't have consistent headers
  if (!signatures) {
    return true;
  }

  return signatures.some((sig) => {
    if (buffer.length < sig.length) return false;
    return sig.every((byte, i) => buffer[i] === byte);
  });
}

/**
 * Sanitize a filename to prevent path traversal and special character attacks.
 * Strips directory separators, null bytes, and control characters.
 * Replaces spaces and special chars with underscores.
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  let sanitized = filename.replace(/^.*[\\/]/, '');

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '');

  // Replace problematic characters with underscores
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');

  // Collapse multiple underscores/spaces
  sanitized = sanitized.replace(/[_\s]+/g, '_');

  // Remove leading/trailing dots and underscores
  sanitized = sanitized.replace(/^[._]+|[._]+$/g, '');

  // Fallback for empty result
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'unnamed_file';
  }

  // Truncate to reasonable length (preserving extension)
  if (sanitized.length > 200) {
    const ext = sanitized.lastIndexOf('.');
    if (ext > 0) {
      const extension = sanitized.slice(ext);
      sanitized = sanitized.slice(0, 200 - extension.length) + extension;
    } else {
      sanitized = sanitized.slice(0, 200);
    }
  }

  return sanitized;
}

/**
 * Generate a SHA-256 checksum for duplicate detection.
 */
export function generateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Strip file extension from a filename.
 */
export function stripExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}
