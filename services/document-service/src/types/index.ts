import { Request } from 'express';

// ── JWT ─────────────────────────────────────────────────────────────────

export interface JwtAccessPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'student' | 'admin';

export interface AuthenticatedRequest extends Request {
  user?: JwtAccessPayload;
}

// ── Document ────────────────────────────────────────────────────────────

export type DocumentStatus =
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'deleted';

export type ProcessingStage =
  | 'none'
  | 'pending'
  | 'extracting'
  | 'embedding'
  | 'complete'
  | 'error';

export interface DocumentMetadata {
  pageCount?: number;
  wordCount?: number;
  language?: string;
  [key: string]: unknown;
}

// ── Storage ─────────────────────────────────────────────────────────────

export interface StorageResult {
  key: string;
  path: string;
  size: number;
}

// ── Pagination ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Query ───────────────────────────────────────────────────────────────

export interface DocumentQuery {
  page: number;
  limit: number;
  search?: string;
  status?: DocumentStatus;
  mimeType?: string;
  sortBy: 'uploadedAt' | 'displayName' | 'size';
  sortOrder: 'asc' | 'desc';
}
