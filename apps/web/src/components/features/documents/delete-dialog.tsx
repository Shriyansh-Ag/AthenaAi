'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteDialogProps {
  isOpen: boolean;
  documentName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteDialog({
  isOpen,
  documentName,
  onClose,
  onConfirm,
  isLoading,
}: DeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-sm',
          'rounded-2xl border border-zinc-200 dark:border-zinc-700',
          'bg-white dark:bg-zinc-900 shadow-2xl',
          'p-6 animate-in zoom-in-95 fade-in-0 duration-150'
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
          </div>

          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Delete Document
          </h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Are you sure you want to delete{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              &ldquo;{documentName}&rdquo;
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex gap-2 mt-5 w-full">
            <button
              onClick={onClose}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                'border border-zinc-200 dark:border-zinc-700',
                'text-zinc-700 dark:text-zinc-300',
                'hover:bg-zinc-50 dark:hover:bg-zinc-800'
              )}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                'bg-red-600 text-white',
                'hover:bg-red-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              id="delete-confirm-button"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
