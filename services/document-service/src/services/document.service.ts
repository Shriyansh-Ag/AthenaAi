import { v4 as uuidv4 } from 'uuid';
import { DocumentRepository } from '../repositories/document.repository';
import { intelligenceClient } from './intelligence.client';
import { ChunkModel } from '../models/chunk.model';
import { embeddingQueueService } from './embedding-queue.service';
import { qdrantClient } from './qdrant.client';
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
      status: 'queued',
      processingStage: 'pending',
    });

    logger.info(`Document created: ${document._id} for user ${userId}`);

    // Trigger async processing
    this.processDocument(document._id.toString(), userId, file).catch(err => {
      logger.error(`Background processing failed for ${document._id}`, err);
    });

    return document;
  }

  private async processDocument(documentId: string, userId: string, file: Express.Multer.File) {
    try {
      await this.documentRepository.updateById(documentId, userId, {
        status: 'processing',
        processingStage: 'extracting'
      });

      const extractedContent = await intelligenceClient.extractDocument(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      await this.documentRepository.updateById(documentId, userId, {
        processingStage: 'chunking'
      });

      const chunkResponse = await intelligenceClient.chunkDocument(extractedContent, documentId);

      // Save chunks to MongoDB
      if (chunkResponse && chunkResponse.chunks && chunkResponse.chunks.length > 0) {
        const chunkDocs = chunkResponse.chunks.map((chunk: any) => ({
          documentId,
          text: chunk.text,
          chunkIndex: chunk.metadata.chunk_index,
          metadata: chunk.metadata
        }));
        await ChunkModel.insertMany(chunkDocs);
        logger.info(`Saved ${chunkDocs.length} chunks for document ${documentId}`);
        
        // Trigger background embedding processing
        embeddingQueueService.processQueue().catch(err => {
          logger.error(`Error processing embedding queue for document ${documentId}:`, err);
        });
      }

      await this.documentRepository.updateById(documentId, userId, {
        status: 'processed',
        processingStage: 'complete',
        extractedContent
      });
      logger.info(`Document ${documentId} processed successfully`);
    } catch (error) {
      logger.error(`Error processing document ${documentId}:`, error);
      await this.documentRepository.updateById(documentId, userId, {
        status: 'failed',
        processingStage: 'error'
      });
    }
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

    // Delete chunks from vector database
    qdrantClient.deleteByDocumentId(documentId).catch(err => {
      logger.error(`Error deleting Qdrant vectors for ${documentId}:`, err);
    });

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

  /**
   * Search chunks using Semantic, Keyword, or Hybrid search.
   */
  async search(
    userId: string,
    query: string,
    type: 'semantic' | 'keyword' | 'hybrid' = 'hybrid',
    filters: { course?: string; tags?: string[] } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<any[]> {
    const k = 60; // Constant for RRF
    const fetchLimit = 100; // Fetch top 100 for fusion

    let semanticResults: any[] = [];
    let keywordResults: any[] = [];

    // 1. Semantic Search (Qdrant)
    if (type === 'semantic' || type === 'hybrid') {
      const response = await intelligenceClient.embedChunks([query], 'all-MiniLM-L6-v2');
      if (response.embeddings && response.embeddings.length > 0) {
        const queryVector = response.embeddings[0];
        semanticResults = await qdrantClient.search(
          queryVector,
          userId,
          type === 'hybrid' ? fetchLimit : limit,
          filters
        );
      }
    }

    // 2. Keyword Search (MongoDB)
    if (type === 'keyword' || type === 'hybrid') {
      const mongoQuery: any = {
        $text: { $search: query }
      };

      // We must scope this to the user's documents
      // First find user's documents matching filters
      const docFilter: any = { userId, status: 'processed' };
      
      const userDocs = await this.documentRepository.findByUserId(userId, { limit: 10000, page: 1 } as any);
      const userDocIds = userDocs.data.map(d => d._id);
      mongoQuery.documentId = { $in: userDocIds };

      if (filters.course) {
        mongoQuery['metadata.course'] = filters.course;
      }
      if (filters.tags && filters.tags.length > 0) {
        mongoQuery['metadata.tags'] = { $in: filters.tags };
      }

      const queryLimit = type === 'hybrid' ? fetchLimit : limit;
      
      const chunks = await ChunkModel.find(mongoQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(queryLimit)
        .lean()
        .exec();

      keywordResults = chunks.map((chunk: any) => ({
        id: chunk._id.toString(),
        score: chunk.score,
        payload: {
          documentId: chunk.documentId.toString(),
          chunkIndex: chunk.chunkIndex,
          metadata: chunk.metadata,
          text: chunk.text
        }
      }));
    }

    // 3. Combine Results
    if (type === 'semantic') {
      // Qdrant doesn't store 'text' in payload currently, we need to fetch text from Mongo
      return this.hydrateResults(semanticResults, page, limit);
    }

    if (type === 'keyword') {
      const skip = (page - 1) * limit;
      return keywordResults.slice(skip, skip + limit);
    }

    // 4. Hybrid Search (RRF)
    const fusedScores = new Map<string, { score: number; item: any }>();

    // Add Semantic Scores
    semanticResults.forEach((item, index) => {
      const rank = index + 1;
      const rrfScore = 1 / (k + rank);
      fusedScores.set(item.id, { score: rrfScore, item });
    });

    // Add Keyword Scores
    keywordResults.forEach((item, index) => {
      const rank = index + 1;
      const rrfScore = 1 / (k + rank);
      
      if (fusedScores.has(item.id)) {
        const existing = fusedScores.get(item.id)!;
        existing.score += rrfScore;
        // Merge payload to get text if not present in semantic
        existing.item.payload.text = item.payload.text;
      } else {
        fusedScores.set(item.id, { score: rrfScore, item });
      }
    });

    // Sort by fused score descending
    const sortedResults = Array.from(fusedScores.values())
      .sort((a, b) => b.score - a.score)
      .map(entry => {
        return {
          ...entry.item,
          score: entry.score // Overwrite original score with RRF score
        };
      });

    // Hydrate semantic-only hits with text from MongoDB and paginate
    return this.hydrateResults(sortedResults, page, limit);
  }

  /**
   * Helper to fetch chunk text & document info for Qdrant results.
   */
  private async hydrateResults(results: any[], page: number, limit: number): Promise<any[]> {
    const skip = (page - 1) * limit;
    const paginated = results.slice(skip, skip + limit);

    const chunkIds = paginated.map(r => r.id);
    const chunks = await ChunkModel.find({ _id: { $in: chunkIds } })
      .populate('documentId')
      .lean()
      .exec();
    
    const chunkMap = new Map(chunks.map(c => [c._id.toString(), c]));

    return paginated.map(result => {
      const chunk: any = chunkMap.get(result.id);
      return {
        ...result,
        payload: {
          ...result.payload,
          text: chunk?.text || result.payload?.text,
          documentName: chunk?.documentId?.displayName || 'Unknown Document'
        }
      };
    });
  }

  /**
   * Get user document statistics
   */
  async getStats(userId: string): Promise<any> {
    return this.documentRepository.getUserStats(userId);
  }
}
