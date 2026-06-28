'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DocumentQuery } from '@/types/document';

interface DocumentFiltersProps {
  query: DocumentQuery;
  onQueryChange: (query: DocumentQuery) => void;
  totalResults: number;
}

const FILE_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'PDF', value: 'application/pdf' },
  {
    label: 'DOCX',
    value:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  {
    label: 'PPTX',
    value:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  { label: 'TXT', value: 'text/plain' },
  { label: 'Markdown', value: 'text/markdown' },
  { label: 'CSV', value: 'text/csv' },
  { label: 'PNG', value: 'image/png' },
  { label: 'JPEG', value: 'image/jpeg' },
  { label: 'WebP', value: 'image/webp' },
];

const SORT_OPTIONS = [
  { label: 'Newest first', sortBy: 'uploadedAt' as const, sortOrder: 'desc' as const },
  { label: 'Oldest first', sortBy: 'uploadedAt' as const, sortOrder: 'asc' as const },
  { label: 'Name A-Z', sortBy: 'displayName' as const, sortOrder: 'asc' as const },
  { label: 'Name Z-A', sortBy: 'displayName' as const, sortOrder: 'desc' as const },
  { label: 'Largest first', sortBy: 'size' as const, sortOrder: 'desc' as const },
  { label: 'Smallest first', sortBy: 'size' as const, sortOrder: 'asc' as const },
];

export function DocumentFilters({
  query,
  onQueryChange,
  totalResults,
}: DocumentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = query.mimeType || query.status;

  const currentSort = SORT_OPTIONS.find(
    (o) => o.sortBy === (query.sortBy || 'uploadedAt') && o.sortOrder === (query.sortOrder || 'desc')
  );

  return (
    <div className="space-y-3">
      {/* Search bar + filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={query.search || ''}
            onChange={(e) =>
              onQueryChange({ ...query, search: e.target.value || undefined, page: 1 })
            }
            className={cn(
              'w-full rounded-xl border border-zinc-200 dark:border-zinc-800',
              'bg-white dark:bg-zinc-900/60',
              'py-2.5 pl-10 pr-4 text-sm',
              'text-zinc-800 dark:text-zinc-200',
              'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
              'dark:focus:ring-blue-500/20 dark:focus:border-blue-500',
              'transition-all'
            )}
            id="document-search-input"
          />
          {query.search && (
            <button
              onClick={() => onQueryChange({ ...query, search: undefined, page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all',
            showFilters || hasActiveFilters
              ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
          )}
          id="document-filter-toggle"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              {(query.mimeType ? 1 : 0) + (query.status ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div
          className={cn(
            'rounded-xl border border-zinc-200 dark:border-zinc-800',
            'bg-white dark:bg-zinc-900/60 p-4',
            'animate-in slide-in-from-top-2 fade-in-0 duration-200'
          )}
        >
          <div className="flex flex-wrap gap-4">
            {/* File type filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                File Type
              </label>
              <select
                value={query.mimeType || ''}
                onChange={(e) =>
                  onQueryChange({
                    ...query,
                    mimeType: e.target.value || undefined,
                    page: 1,
                  })
                }
                className={cn(
                  'rounded-lg border border-zinc-200 dark:border-zinc-700',
                  'bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm',
                  'text-zinc-700 dark:text-zinc-300',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                )}
                id="document-type-filter"
              >
                {FILE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Sort By
              </label>
              <select
                value={`${query.sortBy || 'uploadedAt'}-${query.sortOrder || 'desc'}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [
                    'uploadedAt' | 'displayName' | 'size',
                    'asc' | 'desc'
                  ];
                  onQueryChange({ ...query, sortBy, sortOrder });
                }}
                className={cn(
                  'rounded-lg border border-zinc-200 dark:border-zinc-700',
                  'bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm',
                  'text-zinc-700 dark:text-zinc-300',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                )}
                id="document-sort-select"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option
                    key={`${opt.sortBy}-${opt.sortOrder}`}
                    value={`${opt.sortBy}-${opt.sortOrder}`}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={() =>
                    onQueryChange({
                      ...query,
                      mimeType: undefined,
                      status: undefined,
                      page: 1,
                    })
                  }
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {totalResults} {totalResults === 1 ? 'document' : 'documents'}
          {currentSort && ` · ${currentSort.label}`}
        </p>
      </div>
    </div>
  );
}
