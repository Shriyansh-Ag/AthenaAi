import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QdrantService } from '../../src/services/qdrant.client';
import { QdrantClient } from '@qdrant/js-client-rest';

vi.mock('@qdrant/js-client-rest', () => {
  return {
    QdrantClient: class {
      getCollections = vi.fn().mockResolvedValue({ collections: [] });
      createCollection = vi.fn().mockResolvedValue(true);
      upsert = vi.fn().mockResolvedValue(true);
      delete = vi.fn().mockResolvedValue(true);
      search = vi.fn().mockResolvedValue([{ id: '1', score: 0.9 }]);
    }
  };
});

describe('QdrantService', () => {
  let service: QdrantService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new QdrantService();
  });

  it('should initialize and create collection if missing', async () => {
    await service.initialize();
    
    // Check if getCollections was called
    const mockClient = (service as any).client;
    expect(mockClient.getCollections).toHaveBeenCalled();
    // Check if createCollection was called
    expect(mockClient.createCollection).toHaveBeenCalledWith('athena_chunks', {
      vectors: {
        size: 384,
        distance: 'Cosine',
      }
    });
  });

  it('should not create collection if it exists', async () => {
    const mockClient = (service as any).client;
    mockClient.getCollections.mockResolvedValue({ collections: [{ name: 'athena_chunks' }] });
    
    await service.initialize();
    
    expect(mockClient.createCollection).not.toHaveBeenCalled();
  });

  it('should upsert vectors', async () => {
    const mockClient = (service as any).client;
    const points = [
      {
        id: '123',
        vector: [0.1, 0.2],
        payload: {
          namespace: 'user_1',
          documentId: 'doc_1',
          chunkIndex: 0,
          metadata: {}
        }
      }
    ];

    await service.upsertVectors(points);
    
    expect(mockClient.upsert).toHaveBeenCalledWith('athena_chunks', {
      wait: true,
      points: points
    });
  });

  it('should delete by documentId', async () => {
    const mockClient = (service as any).client;
    
    await service.deleteByDocumentId('doc_1');
    
    expect(mockClient.delete).toHaveBeenCalledWith('athena_chunks', {
      wait: true,
      filter: {
        must: [
          {
            key: 'documentId',
            match: { value: 'doc_1' }
          }
        ]
      }
    });
  });

  it('should search with namespace filter', async () => {
    const mockClient = (service as any).client;
    
    const results = await service.search([0.1, 0.2], 'user_1', 3);
    
    expect(mockClient.search).toHaveBeenCalledWith('athena_chunks', {
      vector: [0.1, 0.2],
      limit: 3,
      with_payload: true,
      filter: {
        must: [
          {
            key: 'namespace',
            match: { value: 'user_1' }
          }
        ]
      }
    });
    
    expect(results).toHaveLength(1);
  });
});
