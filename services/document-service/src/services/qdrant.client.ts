import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '../utils/logger';

export interface QdrantPoint {
  id: string; // UUID of the chunk
  vector: number[]; // 384-dimensional vector
  payload: {
    namespace: string; // Used for multi-tenancy / isolation
    documentId: string;
    chunkIndex: number;
    metadata: any;
  };
}

export class QdrantService {
  private client: QdrantClient;
  private readonly collectionName = 'athena_chunks';

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }

  public async initialize(): Promise<void> {
    try {
      // Check health
      const health = await this.client.getCollections();
      logger.info('Qdrant connected successfully.', health);

      // Create collection if it doesn't exist
      const exists = health.collections.some(c => c.name === this.collectionName);
      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 384, // for all-MiniLM-L6-v2
            distance: 'Cosine',
          },
        });
        logger.info(`Qdrant collection '${this.collectionName}' created.`);
      }
    } catch (error) {
      logger.error('Failed to initialize Qdrant:', error);
      throw error;
    }
  }

  public async upsertVectors(points: QdrantPoint[]): Promise<void> {
    if (points.length === 0) return;

    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: points.map(p => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload,
        })),
      });
      logger.info(`Successfully upserted ${points.length} vectors to Qdrant.`);
    } catch (error) {
      logger.error('Error upserting vectors to Qdrant:', error);
      throw error;
    }
  }

  public async deleteByDocumentId(documentId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [
            {
              key: 'documentId',
              match: {
                value: documentId,
              },
            },
          ],
        },
      });
      logger.info(`Deleted Qdrant vectors for document: ${documentId}`);
    } catch (error) {
      logger.error(`Error deleting vectors for document ${documentId}:`, error);
      throw error;
    }
  }

  public async search(
    vector: number[],
    namespace: string,
    limit = 5,
    filters?: { course?: string; tags?: string[] }
  ): Promise<any[]> {
    try {
      const mustFilters: any[] = [
        {
          key: 'namespace',
          match: {
            value: namespace,
          },
        },
      ];

      if (filters?.course) {
        mustFilters.push({
          key: 'metadata.course',
          match: {
            value: filters.course,
          },
        });
      }

      if (filters?.tags && filters.tags.length > 0) {
        mustFilters.push({
          key: 'metadata.tags',
          match: {
            any: filters.tags,
          },
        });
      }

      const results = await this.client.search(this.collectionName, {
        vector: vector,
        limit,
        with_payload: true,
        filter: {
          must: mustFilters,
        },
      });
      return results;
    } catch (error) {
      logger.error('Error searching in Qdrant:', error);
      throw error;
    }
  }
}

export const qdrantClient = new QdrantService();
