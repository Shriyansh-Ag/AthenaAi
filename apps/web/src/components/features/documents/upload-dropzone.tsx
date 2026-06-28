'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, FileUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp';

export function UploadDropzone({
  onFilesSelected,
  isUploading,
  maxSizeMB = 50,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const validateAndSelect = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const valid: File[] = [];
      const rejected: string[] = [];

      files.forEach((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          rejected.push(`${file.name}: unsupported file type`);
        } else if (file.size > maxSizeMB * 1024 * 1024) {
          rejected.push(`${file.name}: exceeds ${maxSizeMB} MB limit`);
        } else {
          valid.push(file);
        }
      });

      setRejectedFiles(rejected);

      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [maxSizeMB, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (isUploading) return;

      const { files } = e.dataTransfer;
      if (files.length > 0) {
        validateAndSelect(files);
      }
    },
    [isUploading, validateAndSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files.length > 0) {
        validateAndSelect(files);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [validateAndSelect]
  );

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ease-out',
          'flex flex-col items-center justify-center gap-4 text-center',
          'group',
          isDragOver && !isUploading
            ? 'border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20 scale-[1.01]'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600',
          isUploading && 'pointer-events-none opacity-60',
          !isDragOver &&
            !isUploading &&
            'bg-gradient-to-br from-zinc-50/50 to-white dark:from-zinc-900/30 dark:to-zinc-950/50'
        )}
      >
        {/* Gradient glow effect on hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300',
            'bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-purple-500/5',
            'group-hover:opacity-100',
            isDragOver && 'opacity-100'
          )}
        />

        <div
          className={cn(
            'relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300',
            isDragOver
              ? 'bg-blue-100 dark:bg-blue-900/40 scale-110'
              : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
          )}
        >
          {isDragOver ? (
            <FileUp className="h-8 w-8 text-blue-500 dark:text-blue-400 animate-bounce" />
          ) : (
            <Upload className="h-8 w-8 text-zinc-400 dark:text-zinc-500 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5" />
          )}
        </div>

        <div className="relative space-y-1.5">
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            or{' '}
            <span className="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2">
              browse files
            </span>
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">
            PDF, DOCX, PPTX, TXT, MD, CSV, PNG, JPEG, WEBP · Max {maxSizeMB} MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileInput}
          className="hidden"
          id="document-upload-input"
        />
      </div>

      {/* Rejected file warnings */}
      {rejectedFiles.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {rejectedFiles.map((msg, i) => (
                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                  {msg}
                </p>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRejectedFiles([]);
              }}
              className="p-0.5 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
