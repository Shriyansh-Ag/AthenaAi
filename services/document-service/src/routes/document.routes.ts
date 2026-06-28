import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { DocumentService } from '../services/document.service';
import { DocumentRepository } from '../repositories/document.repository';
import { createStorageProvider } from '../storage/storage-factory';
import { NoOpVirusScanner } from '../validators/virus-scan.interface';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { uploadMultiple, uploadSingle } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rate-limit';
import { updateDocumentDto } from '../validators/document.validators';
import { env } from '../config/env';

// ── Dependency Injection (Manual, Composition Root) ──────────────────────
const documentRepository = new DocumentRepository();
const storageProvider = createStorageProvider();
const virusScanner = new NoOpVirusScanner();
const maxFileSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const documentService = new DocumentService(
  documentRepository,
  storageProvider,
  virusScanner,
  maxFileSizeBytes
);

const documentController = new DocumentController(documentService);

// ── Route Definitions ────────────────────────────────────────────────────
const router: Router = Router();

// Upload (multipart/form-data)
router.post(
  '/upload',
  authenticate,
  uploadLimiter,
  uploadMultiple,
  documentController.upload
);

// Also support single file upload
router.post(
  '/upload/single',
  authenticate,
  uploadLimiter,
  uploadSingle,
  documentController.upload
);

// List documents (with pagination, search, filters)
router.get(
  '/',
  authenticate,
  documentController.list
);

// Get single document
router.get(
  '/:id',
  authenticate,
  documentController.getById
);

// Download document file
router.get(
  '/:id/download',
  authenticate,
  documentController.download
);

// Update document (rename)
router.patch(
  '/:id',
  authenticate,
  validate(updateDocumentDto),
  documentController.update
);

// Delete document
router.delete(
  '/:id',
  authenticate,
  documentController.delete
);

// Health check
router.get('/health/status', (_req, res) => {
  res.json({ status: 'ok', service: 'document-service', version: '0.1.0' });
});

export { router as documentRoutes };
