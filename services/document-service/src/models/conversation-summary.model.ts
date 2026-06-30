import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationSummary extends Document {
  conversationId: string;
  summary: string;
  lastMessageId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSummarySchema = new Schema<IConversationSummary>(
  {
    conversationId: { 
      type: String, 
      required: true, 
      unique: true, // One summary per conversation
      index: true,
      ref: 'Conversation'
    },
    summary: { type: String, required: true },
    lastMessageId: { type: String, required: true, ref: 'Message' }
  },
  {
    timestamps: true
  }
);

export const ConversationSummaryModel = mongoose.model<IConversationSummary>('ConversationSummary', ConversationSummarySchema);
