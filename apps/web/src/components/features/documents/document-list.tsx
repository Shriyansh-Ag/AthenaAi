'use client';

import { FileText } from 'lucide-react';
import { DocumentCard } from './document-card';
import type { DocumentFile } from '@/types/document';

interface DocumentListProps {
  documents: DocumentFile[];
  isLoading: boolean;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string, filename: string) => void;
  onPreview: (document: DocumentFile) => void;
}

export function DocumentList({
  documents,
  isLoading,
  onRename,
  onDelete,
  onDownload,
  onPreview,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-6 w-6 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-4">
          <FileText className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-300">
          No documents yet
        </h3>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500 max-w-xs">
          Upload your first document using the dropzone above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onRename={onRename}
          onDelete={onDelete}
          onDownload={onDownload}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}
