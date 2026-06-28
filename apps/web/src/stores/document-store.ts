import { create } from 'zustand';
import type { UploadProgress } from '../types/document';

interface DocumentUploadState {
  uploads: UploadProgress[];
  isUploading: boolean;

  addUpload: (upload: UploadProgress) => void;
  updateUpload: (fileId: string, updates: Partial<UploadProgress>) => void;
  removeUpload: (fileId: string) => void;
  clearCompleted: () => void;
  setIsUploading: (uploading: boolean) => void;
  reset: () => void;
}

export const useDocumentUploadStore = create<DocumentUploadState>()((set) => ({
  uploads: [],
  isUploading: false,

  addUpload: (upload) =>
    set((state) => ({
      uploads: [...state.uploads, upload],
    })),

  updateUpload: (fileId, updates) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.fileId === fileId ? { ...u, ...updates } : u
      ),
    })),

  removeUpload: (fileId) =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.fileId !== fileId),
    })),

  clearCompleted: () =>
    set((state) => ({
      uploads: state.uploads.filter(
        (u) => u.status !== 'success' && u.status !== 'error'
      ),
    })),

  setIsUploading: (uploading) => set({ isUploading: uploading }),

  reset: () => set({ uploads: [], isUploading: false }),
}));
