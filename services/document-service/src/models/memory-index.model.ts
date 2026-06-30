import mongoose, { Schema, Document } from 'mongoose';

export interface IMemoryIndex extends Document {
  conversationId: string;
  content: string;
  messageIds: string[];
  createdAt: Date;
}

const MemoryIndexSchema = new Schema<IMemoryIndex>(
  {
    conversationId: { 
      type: String, 
      required: true, 
      index: true,
      ref: 'Conversation'
    },
    content: { type: String, required: true },
    messageIds: { type: [String], required: true, default: [] }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Create a text index for Relevant Memory Search via Keyword Search
MemoryIndexSchema.index({ content: 'text' });
// Compound index for fast retrieval per conversation
MemoryIndexSchema.index({ conversationId: 1, createdAt: 1 });

export const MemoryIndexModel = mongoose.model<IMemoryIndex>('MemoryIndex', MemoryIndexSchema);
