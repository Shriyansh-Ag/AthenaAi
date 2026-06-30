import mongoose, { Schema, Document } from 'mongoose';

export interface ICitation {
  documentId: string;
  documentName?: string;
  chunkId: string;
  chunkIndex?: number;
  similarityScore: number;
  text: string;
}

export interface IConfidenceScores {
  source: number;
  hallucination: number;
  overall: number;
}

export interface IMessage extends Document {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: ICitation[];
  confidenceScores?: IConfidenceScores;
  isPinned: boolean;
  createdAt: Date;
}

const CitationSchema = new Schema<ICitation>({
  documentId: { type: String, required: true },
  documentName: { type: String },
  chunkId: { type: String, required: true },
  chunkIndex: { type: Number },
  similarityScore: { type: Number, required: true },
  text: { type: String, required: true }
}, { _id: false });

const ConfidenceScoresSchema = new Schema<IConfidenceScores>({
  source: { type: Number, required: true },
  hallucination: { type: Number, required: true },
  overall: { type: Number, required: true }
}, { _id: false });

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { 
      type: String, 
      required: true, 
      index: true,
      ref: 'Conversation'
    },
    role: { 
      type: String, 
      enum: ['user', 'assistant', 'system'], 
      required: true 
    },
    content: { type: String, required: true },
    citations: { type: [CitationSchema], default: [] },
    confidenceScores: { type: ConfidenceScoresSchema },
    isPinned: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Index to fetch messages in chronological order for a conversation
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
