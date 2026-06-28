'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { UploadDropzone } from '@/components/features/documents/upload-dropzone';
import { UploadProgress } from '@/components/features/documents/upload-progress';
import { DocumentList } from '@/components/features/documents/document-list';
import { DocumentFilters } from '@/components/features/documents/document-filters';
import { FilePreview } from '@/components/features/documents/file-preview';
import { RenameDialog } from '@/components/features/documents/rename-dialog';
import { DeleteDialog } from '@/components/features/documents/delete-dialog';
import {
  useDocuments,
  useUploadDocuments,
  useRenameDocument,
  useDeleteDocument,
  useDownloadDocument,
} from '@/hooks/use-documents';
import { useDocumentUploadStore } from '@/stores/document-store';
import type { DocumentQuery, DocumentFile } from '@/types/document';
import { cn } from '@/lib/utils';

export default function DocumentsPage() {
  // ── Query state ──────────────────────────────────────────────────────
  const [query, setQuery] = useState<DocumentQuery>({
    page: 1,
    limit: 20,
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  // ── Dialogs ──────────────────────────────────────────────────────────
  const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentFile | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentFile | null>(null);

  // ── Data hooks ───────────────────────────────────────────────────────
  const { data, isLoading } = useDocuments(query);
  const uploadMutation = useUploadDocuments();
  const renameMutation = useRenameDocument();
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();
  const { isUploading } = useDocumentUploadStore();

  const documents = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      uploadMutation.mutate(files, {
        onSuccess: (result) => {
          const { successful, failed } = result.data.summary;
          if (successful > 0) {
            toast.success(
              `${successful} file${successful > 1 ? 's' : ''} uploaded successfully`
            );
          }
          if (failed > 0) {
            toast.error(`${failed} file${failed > 1 ? 's' : ''} failed to upload`);
          }
        },
        onError: () => {
          toast.error('Upload failed. Please try again.');
        },
      });
    },
    [uploadMutation]
  );

  const handleRename = useCallback(
    (id: string, newName: string) => {
      // Find the doc to show dialog
      const doc = documents.find((d) => d.id === id);
      if (doc) {
        setRenameDoc(doc);
      }
    },
    [documents]
  );

  const handleRenameConfirm = useCallback(
    (newName: string) => {
      if (!renameDoc) return;
      renameMutation.mutate(
        { id: renameDoc.id, displayName: newName },
        {
          onSuccess: () => {
            toast.success('Document renamed');
            setRenameDoc(null);
          },
          onError: () => {
            toast.error('Failed to rename document');
          },
        }
      );
    },
    [renameDoc, renameMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (doc) {
        setDeleteDoc(doc);
      }
    },
    [documents]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteDoc) return;
    deleteMutation.mutate(deleteDoc.id, {
      onSuccess: () => {
        toast.success('Document deleted');
        setDeleteDoc(null);
      },
      onError: () => {
        toast.error('Failed to delete document');
      },
    });
  }, [deleteDoc, deleteMutation]);

  const handleDownload = useCallback(
    (id: string, filename: string) => {
      downloadMutation.mutate(
        { id, filename },
        {
          onError: () => {
            toast.error('Failed to download document');
          },
        }
      );
    },
    [downloadMutation]
  );

  const handlePreview = useCallback((doc: DocumentFile) => {
    setPreviewDoc(doc);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Documents
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-0.5">
                  Upload and manage your files
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Upload zone */}
        <section>
          <UploadDropzone
            onFilesSelected={handleFilesSelected}
            isUploading={isUploading}
          />
        </section>

        {/* Upload progress */}
        <UploadProgress />

        {/* Filters */}
        <DocumentFilters
          query={query}
          onQueryChange={setQuery}
          totalResults={pagination.total}
        />

        {/* Document grid */}
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          onRename={handleRename}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onPreview={handlePreview}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() =>
                setQuery((q) => ({ ...q, page: Math.max(1, (q.page || 1) - 1) }))
              }
              disabled={pagination.page <= 1}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                'border border-zinc-200 dark:border-zinc-800',
                'text-zinc-600 dark:text-zinc-400',
                'hover:bg-zinc-50 dark:hover:bg-zinc-800',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="px-3 text-sm text-zinc-500 dark:text-zinc-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() =>
                setQuery((q) => ({
                  ...q,
                  page: Math.min(pagination.totalPages, (q.page || 1) + 1),
                }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                'border border-zinc-200 dark:border-zinc-800',
                'text-zinc-600 dark:text-zinc-400',
                'hover:bg-zinc-50 dark:hover:bg-zinc-800',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <FilePreview
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
      />

      <RenameDialog
        isOpen={!!renameDoc}
        currentName={renameDoc?.displayName || ''}
        onClose={() => setRenameDoc(null)}
        onConfirm={handleRenameConfirm}
        isLoading={renameMutation.isPending}
      />

      <DeleteDialog
        isOpen={!!deleteDoc}
        documentName={deleteDoc?.displayName || ''}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
