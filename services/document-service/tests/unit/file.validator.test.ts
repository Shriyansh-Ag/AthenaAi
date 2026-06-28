import { describe, it, expect } from 'vitest';
import {
  isAllowedMimeType,
  verifyMagicBytes,
  sanitizeFilename,
  generateChecksum,
  stripExtension,
} from '../../src/validators/file.validator';

describe('File Validator', () => {
  // ── MIME Type Validation ────────────────────────────────────────────

  describe('isAllowedMimeType', () => {
    it('should accept PDF', () => {
      expect(isAllowedMimeType('application/pdf')).toBe(true);
    });

    it('should accept DOCX', () => {
      expect(
        isAllowedMimeType(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe(true);
    });

    it('should accept PPTX', () => {
      expect(
        isAllowedMimeType(
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
      ).toBe(true);
    });

    it('should accept text/plain', () => {
      expect(isAllowedMimeType('text/plain')).toBe(true);
    });

    it('should accept text/markdown', () => {
      expect(isAllowedMimeType('text/markdown')).toBe(true);
    });

    it('should accept text/csv', () => {
      expect(isAllowedMimeType('text/csv')).toBe(true);
    });

    it('should accept image/png', () => {
      expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('should accept image/jpeg', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
    });

    it('should accept image/webp', () => {
      expect(isAllowedMimeType('image/webp')).toBe(true);
    });

    it('should reject application/zip', () => {
      expect(isAllowedMimeType('application/zip')).toBe(false);
    });

    it('should reject application/x-executable', () => {
      expect(isAllowedMimeType('application/x-executable')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isAllowedMimeType('')).toBe(false);
    });
  });

  // ── Magic Bytes ─────────────────────────────────────────────────────

  describe('verifyMagicBytes', () => {
    it('should verify PDF magic bytes', () => {
      const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
      expect(verifyMagicBytes('application/pdf', buffer)).toBe(true);
    });

    it('should reject non-PDF content declared as PDF', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
      expect(verifyMagicBytes('application/pdf', buffer)).toBe(false);
    });

    it('should verify PNG magic bytes', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      expect(verifyMagicBytes('image/png', buffer)).toBe(true);
    });

    it('should verify JPEG magic bytes', () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(verifyMagicBytes('image/jpeg', buffer)).toBe(true);
    });

    it('should verify ZIP-based format magic bytes (DOCX/PPTX)', () => {
      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      expect(
        verifyMagicBytes(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer
        )
      ).toBe(true);
    });

    it('should skip magic byte check for text formats', () => {
      const buffer = Buffer.from('Hello, world!');
      expect(verifyMagicBytes('text/plain', buffer)).toBe(true);
      expect(verifyMagicBytes('text/markdown', buffer)).toBe(true);
      expect(verifyMagicBytes('text/csv', buffer)).toBe(true);
    });

    it('should reject buffer shorter than signature', () => {
      const buffer = Buffer.from([0x25, 0x50]); // Only 2 bytes, PDF needs 4
      expect(verifyMagicBytes('application/pdf', buffer)).toBe(false);
    });
  });

  // ── Filename Sanitization ───────────────────────────────────────────

  describe('sanitizeFilename', () => {
    it('should pass through normal filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
    });

    it('should strip path traversal sequences', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
    });

    it('should strip backslash paths', () => {
      expect(sanitizeFilename('C:\\Windows\\System32\\evil.exe')).toBe('evil.exe');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\x00.pdf')).toBe('file.pdf');
    });

    it('should replace special characters', () => {
      // <, >, :, " each become _, then collapsed: file___name → file_name
      // |, ?, * each become _, then collapsed before .pdf
      expect(sanitizeFilename('file<>:"name|?*.pdf')).toBe('file_name_.pdf');
    });

    it('should collapse multiple underscores', () => {
      expect(sanitizeFilename('file___name.pdf')).toBe('file_name.pdf');
    });

    it('should remove leading dots', () => {
      expect(sanitizeFilename('.hidden_file.pdf')).toBe('hidden_file.pdf');
    });

    it('should return fallback for empty result', () => {
      expect(sanitizeFilename('...')).toBe('unnamed_file');
    });

    it('should truncate very long filenames', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(200);
      expect(result.endsWith('.pdf')).toBe(true);
    });
  });

  // ── Checksum ────────────────────────────────────────────────────────

  describe('generateChecksum', () => {
    it('should generate consistent SHA-256 hashes', () => {
      const buffer = Buffer.from('test content');
      const hash1 = generateChecksum(buffer);
      const hash2 = generateChecksum(buffer);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('should generate different hashes for different content', () => {
      const hash1 = generateChecksum(Buffer.from('content A'));
      const hash2 = generateChecksum(Buffer.from('content B'));
      expect(hash1).not.toBe(hash2);
    });
  });

  // ── Strip Extension ─────────────────────────────────────────────────

  describe('stripExtension', () => {
    it('should strip .pdf extension', () => {
      expect(stripExtension('document.pdf')).toBe('document');
    });

    it('should strip .docx extension', () => {
      expect(stripExtension('report.docx')).toBe('report');
    });

    it('should handle filenames without extension', () => {
      expect(stripExtension('README')).toBe('README');
    });

    it('should only strip the last extension', () => {
      expect(stripExtension('archive.tar.gz')).toBe('archive.tar');
    });
  });
});
