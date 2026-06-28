import type { StorageResult } from '../types';

/**
 * Abstract storage provider interface.
 *
 * Implementations can target local filesystem, AWS S3, Cloudflare R2,
 * or Azure Blob Storage without changing business logic.
 */
export interface StorageProvider {
  /**
   * Upload a file buffer to storage.
   * @param key   Unique storage key (e.g. `userId/uuid.ext`)
   * @param data  File content as a Buffer
   * @param mimeType  Content type header
   * @returns     Storage result with key, path, and size
   */
  upload(key: string, data: Buffer, mimeType: string): Promise<StorageResult>;

  /**
   * Download a file from storage.
   * @param key  Storage key
   * @returns    File content as a Buffer
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete a file from storage.
   * @param key  Storage key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists in storage.
   * @param key  Storage key
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a pre-signed URL for direct client download.
   * Optional — not all providers need this.
   */
  getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string>;
}
