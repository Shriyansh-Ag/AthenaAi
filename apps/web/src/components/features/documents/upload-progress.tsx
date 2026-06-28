'use client';

import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadProgress as UploadProgressType } from '@/types/document';
import { formatFileSize, getFileTypeConfig } from '@/types/document';
import { useDocumentUploadStore } from '@/stores/document-store';

export function UploadProgress() {
  const { uploads, removeUpload, clearCompleted } = useDocumentUploadStore();

  if (uploads.length === 0) return null;

  const hasCompleted = uploads.some(
    (u) => u.status === 'success' || u.status === 'error'
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Uploads
        </h3>
        {hasCompleted && (
          <button
            onClick={clearCompleted}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>

      <div className="space-y-2">
        {uploads.map((upload) => (
          <UploadProgressItem
            key={upload.fileId}
            upload={upload}
            onRemove={() => removeUpload(upload.fileId)}
          />
        ))}
      </div>
    </div>
  );
}

function UploadProgressItem({
  upload,
  onRemove,
}: {
  upload: UploadProgressType;
  onRemove: () => void;
}) {
  const config = getFileTypeConfig(upload.mimeType);

  return (
    <div
      className={cn(
        'group relative rounded-xl border p-3 transition-all duration-200',
        upload.status === 'success'
          ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10'
          : upload.status === 'error'
            ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
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

        {/* File info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {upload.filename}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {formatFileSize(upload.size)}
            </span>
            {upload.status === 'error' && upload.error && (
              <span className="text-xs text-red-500 dark:text-red-400 truncate">
                {upload.error}
              </span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="shrink-0">
          {upload.status === 'uploading' && (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          )}
          {upload.status === 'success' && (
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          )}
          {upload.status === 'error' && (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          {upload.status === 'pending' && (
            <div className="h-5 w-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
          )}
        </div>

        {/* Remove button */}
        {(upload.status === 'success' || upload.status === 'error') && (
          <button
            onClick={onRemove}
            className="shrink-0 p-0.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {upload.status === 'uploading' && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300 ease-out"
            style={{ width: `${upload.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
