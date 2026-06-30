import { Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { documentQueryDto, updateDocumentDto, searchQueryDto } from '../validators/document.validators';
import { BadRequestError } from '../utils/app-error';
import type { AuthenticatedRequest } from '../types';

export class DocumentController {
  constructor(private documentService: DocumentService) {}

  /**
   * POST /documents/upload
   * Upload one or more documents (multipart/form-data).
   */
  upload = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const files = req.files as Express.Multer.File[] | undefined;
      const singleFile = req.file as Express.Multer.File | undefined;

      const fileList = files || (singleFile ? [singleFile] : []);

      if (fileList.length === 0) {
        throw new BadRequestError('No files provided');
      }

      const results = [];
      const errors = [];

      for (const file of fileList) {
        try {
          const document = await this.documentService.upload(userId, file);
          results.push(document);
        } catch (error: unknown) {
          errors.push({
            filename: file.originalname,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          uploaded: results,
          failed: errors,
          summary: {
            total: fileList.length,
            successful: results.length,
            failed: errors.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /documents
   * List documents with pagination, search, and filters.
   */
  list = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const query = documentQueryDto.parse(req.query);

      const result = await this.documentService.list(userId, query);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /documents/stats
   * Get user document statistics
   */
  getStats = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const stats = await this.documentService.getStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /documents/:id
   * Get a single document by ID.
   */
  getById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const documentId = req.params.id as string;

      const document = await this.documentService.getById(userId, documentId);

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /documents/:id
   * Update document (currently: rename).
   */
  update = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const documentId = req.params.id as string;
      const { displayName } = updateDocumentDto.parse(req.body);

      const document = await this.documentService.rename(
        userId,
        documentId,
        displayName
      );

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /documents/:id
   * Soft-delete a document.
   */
  delete = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const documentId = req.params.id as string;

      await this.documentService.delete(userId, documentId);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /documents/:id/download
   * Download a document's file.
   */
  download = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const documentId = req.params.id as string;

      const { buffer, document } = await this.documentService.download(
        userId,
        documentId
      );

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(document.originalName)}"`
      );
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /documents/search
   * Search chunks across user's documents using Qdrant and MongoDB.
   */
  search = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      
      const { query, type, filters, page, limit } = searchQueryDto.parse(req.body);

      const results = await this.documentService.search(
        userId,
        query,
        type,
        filters,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  };
}
