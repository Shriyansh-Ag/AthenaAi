import path from 'path';
import { env } from '../config/env';
import type { StorageProvider } from './storage-provider.interface';
import { LocalStorageProvider } from './local-storage.provider';

/**
 * Factory that creates the correct storage provider based on STORAGE_PROVIDER env.
 *
 * Future providers (S3, R2, Azure) can be added here without
 * changing any business logic upstream.
 */
export function createStorageProvider(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case 'local': {
      const basePath = path.resolve(env.LOCAL_STORAGE_PATH);
      return new LocalStorageProvider(basePath);
    }

    case 's3':
      throw new Error(
        'S3 storage provider is not yet implemented. Set STORAGE_PROVIDER=local for now.'
      );

    case 'r2':
      throw new Error(
        'Cloudflare R2 storage provider is not yet implemented. Set STORAGE_PROVIDER=local for now.'
      );

    case 'azure':
      throw new Error(
        'Azure Blob storage provider is not yet implemented. Set STORAGE_PROVIDER=local for now.'
      );

    default:
      throw new Error(`Unknown storage provider: ${env.STORAGE_PROVIDER}`);
  }
}
