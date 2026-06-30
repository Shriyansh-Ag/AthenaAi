import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';

export interface IChunk extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  text: string;
  chunkIndex: number;
  metadata: any;
  embedding?: number[];
  textHash?: string;
  embeddingVersion?: string;
  createdAt: Date;
}

const chunkSchema = new Schema<IChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    text: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    embedding: { type: [Number] },
    textHash: { type: String, index: true },
    embeddingVersion: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index to easily retrieve chunks in order for a specific document
chunkSchema.index({ documentId: 1, chunkIndex: 1 });

// Text index for keyword search
chunkSchema.index({ text: 'text' });

export const ChunkModel = mongoose.model<IChunk>('DocumentChunk', chunkSchema);
