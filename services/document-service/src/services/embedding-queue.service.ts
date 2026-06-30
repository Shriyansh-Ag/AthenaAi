import crypto from 'crypto';
import { ChunkModel, IChunk } from '../models/chunk.model';
import { intelligenceClient } from './intelligence.client';
import { qdrantClient, QdrantPoint } from './qdrant.client';
import { logger } from '../utils/logger';

export class EmbeddingQueueService {
  private isProcessing = false;
  private readonly batchSize = 32;
  private readonly defaultModel = 'all-MiniLM-L6-v2';

  /**
   * Triggers the async queue processing in the background.
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    try {
      await this.processNextBatch();
    } catch (error) {
      logger.error('Error in EmbeddingQueueService:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processNextBatch(): Promise<void> {
    // Find chunks that don't have embeddings
    const chunks = await ChunkModel.find({ embedding: { $exists: false } })
      .populate('documentId')
      .limit(this.batchSize)
      .exec();

    if (chunks.length === 0) {
      return; // Queue is empty
    }

    logger.info(`Processing batch of ${chunks.length} chunks for embeddings...`);

    const chunksToEmbed: IChunk[] = [];
    const textsToEmbed: string[] = [];
    const qdrantPoints: QdrantPoint[] = [];
    
    // Process text hashes and check for cached duplicates
    for (const chunk of chunks) {
      const textHash = this.computeHash(chunk.text);
      chunk.textHash = textHash;
      chunk.embeddingVersion = this.defaultModel;

      // Check for duplicate in DB
      const existingChunk = await ChunkModel.findOne({
        textHash,
        embeddingVersion: this.defaultModel,
        embedding: { $exists: true }
      }).exec();

      let finalEmbedding: number[] | undefined;

      if (existingChunk && existingChunk.embedding) {
        // Cache hit
        chunk.embedding = existingChunk.embedding;
        finalEmbedding = existingChunk.embedding;
        await chunk.save();
      } else {
        // Cache miss
        chunksToEmbed.push(chunk);
        textsToEmbed.push(chunk.text);
      }

      if (finalEmbedding) {
        const doc = chunk.documentId as any;
        qdrantPoints.push({
          id: chunk.metadata?.id || chunk._id.toString(),
          vector: finalEmbedding,
          payload: {
            namespace: doc.userId?.toString() || 'default', // User-level isolation
            documentId: doc._id.toString(),
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata,
          }
        });
      }
    }

    if (textsToEmbed.length > 0) {
      // Send to python intelligence service
      const response = await intelligenceClient.embedChunks(textsToEmbed, this.defaultModel);
      
      const embeddings = response.embeddings;
      
      // Update the chunks with new embeddings
      const bulkOps = chunksToEmbed.map((chunk, index) => {
        const emb = embeddings[index];
        const doc = chunk.documentId as any;
        qdrantPoints.push({
          id: chunk.metadata?.id || chunk._id.toString(),
          vector: emb,
          payload: {
            namespace: doc.userId?.toString() || 'default',
            documentId: doc._id.toString(),
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata,
          }
        });

        return {
          updateOne: {
            filter: { _id: chunk._id },
            update: {
              $set: {
                embedding: emb,
                textHash: chunk.textHash,
                embeddingVersion: chunk.embeddingVersion
              }
            }
          }
        };
      });

      if (bulkOps.length > 0) {
        await ChunkModel.bulkWrite(bulkOps);
      }
    }

    // Push to Qdrant
    if (qdrantPoints.length > 0) {
      await qdrantClient.upsertVectors(qdrantPoints);
    }

    // Check if there are more items in the queue
    const remaining = await ChunkModel.countDocuments({ embedding: { $exists: false } });
    if (remaining > 0) {
      // Recursive call for next batch
      await this.processNextBatch();
    }
  }

  private computeHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}

export const embeddingQueueService = new EmbeddingQueueService();
