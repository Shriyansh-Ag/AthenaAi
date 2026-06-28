'use client';

import { MoreHorizontal, Pencil, Trash2, Download, Eye } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { DocumentFile } from '@/types/document';
import { formatFileSize, formatDate, getFileTypeConfig } from '@/types/document';

interface DocumentCardProps {
  document: DocumentFile;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string, filename: string) => void;
  onPreview: (document: DocumentFile) => void;
}

export function DocumentCard({
  document,
  onRename,
  onDelete,
  onDownload,
  onPreview,
}: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const config = getFileTypeConfig(document.mimeType);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showMenu]);

  const isImage = document.mimeType.startsWith('image/');

  const statusBadge = document.status !== 'uploaded' && (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        document.status === 'processing' &&
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        document.status === 'processed' &&
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        document.status === 'failed' &&
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        document.status === 'queued' &&
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      )}
    >
      {document.status}
    </span>
  );

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-zinc-200 dark:border-zinc-800',
        'bg-white dark:bg-zinc-900/60',
        'p-4 transition-all duration-200',
        'hover:border-zinc-300 dark:hover:border-zinc-700',
        'hover:shadow-sm dark:hover:shadow-zinc-900/50'
      )}
    >
      {/* Header with type badge and menu */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
            config.bgColor,
            config.darkBgColor,
            config.color
          )}
        >
          {config.label}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'opacity-0 group-hover:opacity-100',
              showMenu && 'opacity-100 bg-zinc-100 dark:bg-zinc-800'
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div
              className={cn(
                'absolute right-0 top-full mt-1 z-50 w-44',
                'rounded-xl border border-zinc-200 dark:border-zinc-700',
                'bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-950/50',
                'py-1 animate-in fade-in-0 zoom-in-95 duration-100'
              )}
            >
              {isImage && (
                <MenuButton
                  icon={<Eye className="h-4 w-4" />}
                  label="Preview"
                  onClick={() => {
                    setShowMenu(false);
                    onPreview(document);
                  }}
                />
              )}
              <MenuButton
                icon={<Pencil className="h-4 w-4" />}
                label="Rename"
                onClick={() => {
                  setShowMenu(false);
                  const newName = window.prompt(
                    'Enter new name:',
                    document.displayName
                  );
                  if (newName && newName.trim() !== document.displayName) {
                    onRename(document.id, newName.trim());
                  }
                }}
              />
              <MenuButton
                icon={<Download className="h-4 w-4" />}
                label="Download"
                onClick={() => {
                  setShowMenu(false);
                  onDownload(document.id, document.originalName);
                }}
              />
              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
              <MenuButton
                icon={<Trash2 className="h-4 w-4" />}
                label="Delete"
                variant="danger"
                onClick={() => {
                  setShowMenu(false);
                  onDelete(document.id);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* File name */}
      <div className="mt-3 space-y-1">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate leading-snug">
          {document.displayName}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatFileSize(document.size)}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatDate(document.uploadedAt)}
          </span>
          {statusBadge}
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
        variant === 'danger'
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
