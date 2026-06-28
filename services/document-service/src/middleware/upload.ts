import multer from 'multer';
import { env } from '../config/env';
import { ALLOWED_MIME_SET } from '../config/mime-types';

const maxSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Multer configuration for document uploads.
 * Uses memory storage so files are available as Buffer for validation,
 * checksum generation, and storage provider upload.
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxSizeBytes,
    files: 10, // Max 10 files per request
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_SET.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

import { RequestHandler } from 'express';

/** Single file upload (field name: "file") */
export const uploadSingle: RequestHandler = uploadMiddleware.single('file');

/** Multiple file upload (field name: "files", max 10) */
export const uploadMultiple: RequestHandler = uploadMiddleware.array('files', 10);
