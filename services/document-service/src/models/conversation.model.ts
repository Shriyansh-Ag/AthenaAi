import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  userId: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'New Conversation' },
    status: { 
      type: String, 
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true,
  }
);

// Index for getting user's active conversations sorted by most recent
ConversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const ConversationModel = mongoose.model<IConversation>('Conversation', ConversationSchema);
