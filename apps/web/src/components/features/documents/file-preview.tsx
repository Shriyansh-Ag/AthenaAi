'use client';

import { X, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentFile } from '@/types/document';
import { formatFileSize, formatDate, getFileTypeConfig } from '@/types/document';

interface FilePreviewProps {
  document: DocumentFile | null;
  onClose: () => void;
  onDownload: (id: string, filename: string) => void;
}

export function FilePreview({ document, onClose, onDownload }: FilePreviewProps) {
  if (!document) return null;

  const config = getFileTypeConfig(document.mimeType);
  const isImage = document.mimeType.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-2xl max-h-[85vh] overflow-hidden',
          'rounded-2xl border border-zinc-200 dark:border-zinc-700',
          'bg-white dark:bg-zinc-900 shadow-2xl',
          'animate-in zoom-in-95 fade-in-0 duration-200'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                config.bgColor,
                config.darkBgColor,
                config.color
              )}
            >
              {config.label}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {document.displayName}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {formatFileSize(document.size)} · {formatDate(document.uploadedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDownload(document.id, document.originalName)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
          {isImage ? (
            <div className="flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                Image preview available after download
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-6 text-center">
                <div
                  className={cn(
                    'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl text-sm font-bold',
                    config.bgColor,
                    config.darkBgColor,
                    config.color
                  )}
                >
                  {config.label}
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {document.originalName}
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Preview not available for this file type.
                  <br />
                  Download the file to view its contents.
                </p>
              </div>

              {/* Metadata */}
              <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                <MetadataRow label="Original Name" value={document.originalName} />
                <MetadataRow label="MIME Type" value={document.mimeType} />
                <MetadataRow label="Extension" value={document.extension} />
                <MetadataRow label="Size" value={formatFileSize(document.size)} />
                <MetadataRow label="Status" value={document.status} />
                <MetadataRow
                  label="Uploaded"
                  value={new Date(document.uploadedAt).toLocaleString()}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono">
        {value}
      </span>
    </div>
  );
}
