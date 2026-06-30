import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptLog extends Document {
  conversationId: string;
  userId: string;
  provider: string;
  modelId: string;
  promptTokens?: number;
  completionTokens?: number;
  durationMs?: number;
  systemPrompt: string;
  messages: any[];
  error?: string;
  createdAt: Date;
}

const PromptLogSchema = new Schema<IPromptLog>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    modelId: { type: String, required: true },
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    durationMs: { type: Number },
    systemPrompt: { type: String, required: true },
    messages: { type: Schema.Types.Mixed, required: true },
    error: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const PromptLogModel = mongoose.model<IPromptLog>('PromptLog', PromptLogSchema);
