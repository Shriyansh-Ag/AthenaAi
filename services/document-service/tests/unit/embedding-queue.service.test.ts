import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddingQueueService } from '../../src/services/embedding-queue.service';
import { ChunkModel } from '../../src/models/chunk.model';
import { intelligenceClient } from '../../src/services/intelligence.client';

vi.mock('../../src/models/chunk.model', () => {
  return {
    ChunkModel: {
      find: vi.fn(),
      findOne: vi.fn(),
      bulkWrite: vi.fn(),
      countDocuments: vi.fn()
    }
  };
});

vi.mock('../../src/services/intelligence.client', () => {
  return {
    intelligenceClient: {
      embedChunks: vi.fn()
    }
  };
});

vi.mock('../../src/services/qdrant.client', () => {
  return {
    qdrantClient: {
      upsertVectors: vi.fn()
    }
  };
});

describe('EmbeddingQueueService', () => {
  let service: EmbeddingQueueService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmbeddingQueueService();
  });

  it('should process queue and embed un-cached chunks', async () => {
    const mockChunks = [
      { _id: '1', text: 'hello', documentId: { _id: 'doc1', userId: 'user1' }, save: vi.fn() },
      { _id: '2', text: 'world', documentId: { _id: 'doc2', userId: 'user1' }, save: vi.fn() }
    ];

    // Mock ChunkModel.find()
    (ChunkModel.find as any).mockReturnValue({
      populate: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockChunks)
        })
      })
    });

    // Mock countDocuments to terminate loop
    (ChunkModel.countDocuments as any).mockResolvedValue(0);

    // Mock findOne (simulate cache miss for both)
    (ChunkModel.findOne as any).mockReturnValue({
      exec: vi.fn().mockResolvedValue(null)
    });

    // Mock intelligenceClient.embedChunks
    (intelligenceClient.embedChunks as any).mockResolvedValue({
      embeddings: [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6]
      ]
    });

    await service.processQueue();

    expect(intelligenceClient.embedChunks).toHaveBeenCalledWith(['hello', 'world'], 'all-MiniLM-L6-v2');
    expect(ChunkModel.bulkWrite).toHaveBeenCalledTimes(1);
    const bulkWriteArgs = (ChunkModel.bulkWrite as any).mock.calls[0][0];
    expect(bulkWriteArgs.length).toBe(2);
    expect(bulkWriteArgs[0].updateOne.update.$set.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(bulkWriteArgs[0].updateOne.update.$set.textHash).toBeDefined();
  });

  it('should skip python service if chunk is found in cache', async () => {
    const mockChunk = { _id: '3', text: 'cached text', documentId: { _id: 'doc3', userId: 'user1' }, save: vi.fn() };

    (ChunkModel.find as any).mockReturnValue({
      populate: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([mockChunk])
        })
      })
    });

    (ChunkModel.countDocuments as any).mockResolvedValue(0);

    // Mock cache hit
    (ChunkModel.findOne as any).mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        embedding: [0.9, 0.9, 0.9]
      })
    });

    await service.processQueue();

    // Should NOT call intelligence client
    expect(intelligenceClient.embedChunks).not.toHaveBeenCalled();
    // Should NOT bulkwrite
    expect(ChunkModel.bulkWrite).not.toHaveBeenCalled();
    // Should save the chunk directly with the cached embedding
    expect(mockChunk.save).toHaveBeenCalledTimes(1);
    expect((mockChunk as any).embedding).toEqual([0.9, 0.9, 0.9]);
  });
});
