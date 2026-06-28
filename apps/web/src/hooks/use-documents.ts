import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../lib/documents';
import { useDocumentUploadStore } from '../stores/document-store';
import type { DocumentQuery, UploadProgress } from '../types/document';

const DOCUMENTS_KEY = 'documents';

/**
 * Hook for listing documents with pagination, search, and filters.
 */
export function useDocuments(query: DocumentQuery = {}) {
  return useQuery({
    queryKey: [DOCUMENTS_KEY, query],
    queryFn: () => documentsApi.list(query),
  });
}

/**
 * Hook for fetching a single document.
 */
export function useDocument(id: string | null) {
  return useQuery({
    queryKey: [DOCUMENTS_KEY, id],
    queryFn: () => documentsApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook for uploading documents with progress tracking.
 */
export function useUploadDocuments() {
  const queryClient = useQueryClient();
  const { addUpload, updateUpload, setIsUploading } = useDocumentUploadStore();

  return useMutation({
    mutationFn: async (files: File[]) => {
      setIsUploading(true);

      // Create progress entries for each file
      const fileEntries: UploadProgress[] = files.map((file) => ({
        fileId: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename: file.name,
        progress: 0,
        status: 'uploading' as const,
        size: file.size,
        mimeType: file.type,
      }));

      fileEntries.forEach((entry) => addUpload(entry));

      const result = await documentsApi.upload(files, (percent) => {
        fileEntries.forEach((entry) =>
          updateUpload(entry.fileId, { progress: percent })
        );
      });

      // Mark each file as success or error
      fileEntries.forEach((entry) => {
        const failed = result.data.failed.find(
          (f) => f.filename === entry.filename
        );
        if (failed) {
          updateUpload(entry.fileId, {
            status: 'error',
            error: failed.error,
            progress: 100,
          });
        } else {
          updateUpload(entry.fileId, {
            status: 'success',
            progress: 100,
          });
        }
      });

      return result;
    },
    onSettled: () => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
    },
  });
}

/**
 * Hook for renaming a document.
 */
export function useRenameDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, displayName }: { id: string; displayName: string }) =>
      documentsApi.rename(id, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
    },
  });
}

/**
 * Hook for deleting a document.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY] });
    },
  });
}

/**
 * Hook for downloading a document.
 */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      documentsApi.download(id, filename),
  });
}
