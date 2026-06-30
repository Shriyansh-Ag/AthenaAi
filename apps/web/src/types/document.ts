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

export interface DocumentFile {
  id: string;
  userId: string;
  originalName: string;
  displayName: string;
  mimeType: string;
  extension: string;
  size: number;
  status: DocumentStatus;
  processingStage: ProcessingStage;
  checksum: string;
  uploadedAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number; // 0–100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  size: number;
  mimeType: string;
}

export interface DocumentQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: DocumentStatus;
  mimeType?: string;
  sortBy?: 'uploadedAt' | 'displayName' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedDocuments {
  success: boolean;
  data: DocumentFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadResponse {
  success: boolean;
  data: {
    uploaded: DocumentFile[];
    failed: Array<{ filename: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
}

export interface DocumentResponse {
  success: boolean;
  data: DocumentFile;
}

/** File type display config */
export interface FileTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
}

/** Map of MIME types to display config for UI */
export const FILE_TYPE_CONFIG: Record<string, FileTypeConfig> = {
  'application/pdf': {
    label: 'PDF',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50',
    darkBgColor: 'dark:bg-red-950/30',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    label: 'DOCX',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-950/30',
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    label: 'PPTX',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50',
    darkBgColor: 'dark:bg-orange-950/30',
  },
  'text/plain': {
    label: 'TXT',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50',
    darkBgColor: 'dark:bg-gray-900/30',
  },
  'text/markdown': {
    label: 'MD',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-950/30',
  },
  'text/csv': {
    label: 'CSV',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50',
    darkBgColor: 'dark:bg-green-950/30',
  },
  'image/png': {
    label: 'PNG',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50',
    darkBgColor: 'dark:bg-teal-950/30',
  },
  'image/jpeg': {
    label: 'JPEG',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50',
    darkBgColor: 'dark:bg-amber-950/30',
  },
  'image/webp': {
    label: 'WEBP',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50',
    darkBgColor: 'dark:bg-cyan-950/30',
  },
};

export function getFileTypeConfig(mimeType: string): FileTypeConfig {
  return FILE_TYPE_CONFIG[mimeType] || {
    label: 'FILE',
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-50',
    darkBgColor: 'dark:bg-zinc-900/30',
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export interface SearchQuery {
  query: string;
  type?: 'semantic' | 'keyword' | 'hybrid';
  filters?: {
    course?: string;
    tags?: string[];
  };
  page?: number;
  limit?: number;
}

export interface SearchChunkResult {
  id: string;
  score: number;
  payload: {
    documentId: string;
    documentName?: string;
    chunkIndex: number;
    text: string;
    metadata?: Record<string, any>;
    namespace?: string;
  };
}

export interface SearchResponse {
  success: boolean;
  data: SearchChunkResult[];
}
export interface DocumentStats {
  overview: {
    totalDocuments: number;
    totalStorageUsed: number;
    processedCount: number;
    processingCount: number;
    failedCount: number;
  };
  byType: Array<{
    _id: string;
    count: number;
    storage: number;
  }>;
  storageOverTime: Array<{
    _id: string;
    size: number;
    count: number;
  }>;
  recentErrors: Array<{
    _id: string;
    displayName: string;
    uploadedAt: string;
    status: string;
  }>;
}
