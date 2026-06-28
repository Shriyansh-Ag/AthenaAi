'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RenameDialogProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  isLoading?: boolean;
}

export function RenameDialog({
  isOpen,
  currentName,
  onClose,
  onConfirm,
  isLoading,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== currentName) {
      onConfirm(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-md',
          'rounded-2xl border border-zinc-200 dark:border-zinc-700',
          'bg-white dark:bg-zinc-900 shadow-2xl',
          'p-6 animate-in zoom-in-95 fade-in-0 duration-150'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Rename Document
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className={cn(
              'w-full rounded-xl border border-zinc-200 dark:border-zinc-700',
              'bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm',
              'text-zinc-800 dark:text-zinc-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
              'dark:focus:ring-blue-500/20 dark:focus:border-blue-500'
            )}
            id="rename-input"
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                'text-zinc-600 dark:text-zinc-400',
                'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || name.trim() === currentName}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900',
                'hover:bg-zinc-800 dark:hover:bg-zinc-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              id="rename-confirm-button"
            >
              {isLoading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
