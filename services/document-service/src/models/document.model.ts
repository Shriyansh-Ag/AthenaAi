import mongoose, { Schema, Document } from 'mongoose';
import type { DocumentStatus, ProcessingStage, DocumentMetadata } from '../types';

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  originalName: string;
  displayName: string;
  mimeType: string;
  extension: string;
  size: number;
  storagePath: string;
  storageKey: string;
  status: DocumentStatus;
  processingStage: ProcessingStage;
  checksum: string;
  uploadedAt: Date;
  updatedAt: Date;
  metadata: DocumentMetadata;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    mimeType: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    storagePath: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'queued', 'processing', 'processed', 'failed', 'deleted'],
      default: 'uploaded',
      index: true,
    },
    processingStage: {
      type: String,
      enum: ['none', 'pending', 'extracting', 'embedding', 'complete', 'error'],
      default: 'none',
    },
    checksum: {
      type: String,
      required: true,
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: {
      transform: function (_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.storageKey;
        delete ret.storagePath;
        return ret;
      },
    },
  }
);

// Compound index for duplicate detection: same user + same file content
documentSchema.index({ userId: 1, checksum: 1 });

// Text index for search
documentSchema.index({ displayName: 'text', originalName: 'text' });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
