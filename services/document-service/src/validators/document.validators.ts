import { z } from 'zod';

/**
 * Zod schema for document rename / update operations.
 */
export const updateDocumentDto = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name cannot be empty')
    .max(200, 'Display name must be at most 200 characters'),
});

export type UpdateDocumentDto = z.infer<typeof updateDocumentDto>;

/**
 * Zod schema for document list query parameters.
 */
export const documentQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z
    .enum(['uploaded', 'queued', 'processing', 'processed', 'failed'])
    .optional(),
  mimeType: z.string().trim().optional(),
  sortBy: z
    .enum(['uploadedAt', 'displayName', 'size'])
    .default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DocumentQueryDto = z.infer<typeof documentQueryDto>;

export const searchQueryDto = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  type: z.enum(['semantic', 'keyword', 'hybrid']).default('hybrid'),
  filters: z.object({
    course: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export type SearchQueryDto = z.infer<typeof searchQueryDto>;
