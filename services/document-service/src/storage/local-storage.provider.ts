import fs from 'fs/promises';
import path from 'path';
import type { StorageProvider } from './storage-provider.interface';
import type { StorageResult } from '../types';

/**
 * Local filesystem storage provider.
 * Files are stored under `basePath/<key>`.
 */
export class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string) {}

  async upload(key: string, data: Buffer, _mimeType: string): Promise<StorageResult> {
    const filePath = path.join(this.basePath, key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);

    return {
      key,
      path: filePath,
      size: data.length,
    };
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      // Ignore if file doesn't exist — idempotent delete
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
