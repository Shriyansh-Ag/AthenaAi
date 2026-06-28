import { v4 as uuidv4 } from 'uuid';
import { DocumentRepository } from '../repositories/document.repository';
import type { StorageProvider } from '../storage/storage-provider.interface';
import type { VirusScanProvider } from '../validators/virus-scan.interface';
import { ALLOWED_MIME_TYPES } from '../config/mime-types';
import {
  isAllowedMimeType,
  verifyMagicBytes,
  sanitizeFilename,
  generateChecksum,
  stripExtension,
} from '../validators/file.validator';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
} from '../utils/app-error';
import { logger } from '../utils/logger';
import type { IDocument } from '../models/document.model';
import type { DocumentQuery, PaginatedResponse } from '../types';

export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private storageProvider: StorageProvider,
    private virusScanner: VirusScanProvider,
    private maxFileSizeBytes: number
  ) {}

  /**
   * Upload a new document.
   */
  async upload(
    userId: string,
    file: Express.Multer.File
  ): Promise<IDocument> {
    // 1. Validate file presence
    if (!file) {
      throw new BadRequestError('No file provided');
    }

    // 2. Validate MIME type
    if (!isAllowedMimeType(file.mimetype)) {
      throw new UnsupportedMediaTypeError(
        `File type "${file.mimetype}" is not supported. Allowed types: PDF, DOCX, PPTX, TXT, MD, CSV, PNG, JPEG, WEBP`
      );
    }

    // 3. Validate file size
    if (file.size > this.maxFileSizeBytes) {
      throw new PayloadTooLargeError(
        `File size ${(file.size / (1024 * 1024)).toFixed(1)} MB exceeds the ${(this.maxFileSizeBytes / (1024 * 1024)).toFixed(0)} MB limit`
      );
    }

    // 4. Verify magic bytes match declared MIME type
    if (!verifyMagicBytes(file.mimetype, file.buffer)) {
      throw new UnsupportedMediaTypeError(
        'File content does not match the declared file type'
      );
    }

    // 5. Virus scan
    const scanResult = await this.virusScanner.scan(file.buffer, file.originalname);
    if (!scanResult.clean) {
      throw new BadRequestError(`File rejected: ${scanResult.threat || 'potential threat detected'}`);
    }

    // 6. Generate checksum for duplicate detection
    const checksum = generateChecksum(file.buffer);

    // 7. Check for duplicates
    const duplicate = await this.documentRepository.findDuplicate(userId, checksum);
    if (duplicate) {
      throw new ConflictError(
        `A file with identical content already exists: "${duplicate.displayName}"`
      );
    }

    // 8. Sanitize filename and prepare storage key
    const sanitizedName = sanitizeFilename(file.originalname);
    const extension = ALLOWED_MIME_TYPES[file.mimetype] || '';
    const storageKey = `${userId}/${uuidv4()}${extension}`;

    // 9. Upload to storage
    const storageResult = await this.storageProvider.upload(
      storageKey,
      file.buffer,
      file.mimetype
    );

    logger.info(`File stored: ${storageKey} (${file.size} bytes)`);

    // 10. Persist metadata
    const document = await this.documentRepository.create({
      userId,
      originalName: sanitizedName,
      displayName: stripExtension(sanitizedName),
      mimeType: file.mimetype,
      extension,
      size: file.size,
      storagePath: storageResult.path,
      storageKey,
      checksum,
    });

    logger.info(`Document created: ${document._id} for user ${userId}`);

    return document;
  }

  /**
   * List documents for a user with pagination, search, and filters.
   */
  async list(
    userId: string,
    query: DocumentQuery
  ): Promise<PaginatedResponse<IDocument>> {
    return this.documentRepository.findByUserId(userId, query);
  }

  /**
   * Get a single document by ID (with ownership check).
   */
  async getById(userId: string, documentId: string): Promise<IDocument> {
    const document = await this.documentRepository.findByIdAndUser(
      documentId,
      userId
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    return document;
  }

  /**
   * Rename a document (update displayName).
   */
  async rename(
    userId: string,
    documentId: string,
    newDisplayName: string
  ): Promise<IDocument> {
    const document = await this.documentRepository.updateById(
      documentId,
      userId,
      { displayName: newDisplayName.trim() }
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    logger.info(`Document renamed: ${documentId} → "${newDisplayName}"`);

    return document;
  }

  /**
   * Soft-delete a document.
   * Marks status as 'deleted' but keeps the record and storage file.
   */
  async delete(userId: string, documentId: string): Promise<void> {
    const document = await this.documentRepository.softDelete(
      documentId,
      userId
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Optionally delete from storage — we keep it for now for recovery
    // await this.storageProvider.delete(document.storageKey);

    logger.info(`Document soft-deleted: ${documentId}`);
  }

  /**
   * Download a document's file content.
   */
  async download(
    userId: string,
    documentId: string
  ): Promise<{ buffer: Buffer; document: IDocument }> {
    const document = await this.getById(userId, documentId);

    const buffer = await this.storageProvider.download(document.storageKey);

    return { buffer, document };
  }
}
