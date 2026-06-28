import { apiClient } from './api-client';
import type {
  PaginatedDocuments,
  DocumentResponse,
  UploadResponse,
  DocumentQuery,
} from '../types/document';

export const documentsApi = {
  /**
   * Upload files with progress tracking.
   * Uses XMLHttpRequest for onUploadProgress support.
   */
  upload: async (
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const res = await apiClient.post<UploadResponse>(
      '/documents/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percent);
          }
        },
      }
    );

    return res.data;
  },

  /**
   * List documents with pagination, search, and filters.
   */
  list: async (query: DocumentQuery = {}): Promise<PaginatedDocuments> => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.mimeType) params.set('mimeType', query.mimeType);
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);

    const res = await apiClient.get<PaginatedDocuments>(
      `/documents?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Get a single document by ID.
   */
  get: async (id: string): Promise<DocumentResponse> => {
    const res = await apiClient.get<DocumentResponse>(`/documents/${id}`);
    return res.data;
  },

  /**
   * Rename a document.
   */
  rename: async (id: string, displayName: string): Promise<DocumentResponse> => {
    const res = await apiClient.patch<DocumentResponse>(`/documents/${id}`, {
      displayName,
    });
    return res.data;
  },

  /**
   * Delete a document.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  /**
   * Download a document file.
   */
  download: async (id: string, filename: string): Promise<void> => {
    const res = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });

    // Trigger browser download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
