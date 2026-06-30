import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Citation {
  documentId: string;
  documentName?: string;
  chunkId: string;
  chunkIndex?: number;
  similarityScore: number;
  text: string;
}

interface SourceViewerModalProps {
  citation: Citation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceViewerModal({ citation, isOpen, onClose }: SourceViewerModalProps) {
  if (!citation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-primary" />
            Source Context
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-muted/30 p-3 rounded-lg border">
            <div>
              <h3 className="font-semibold">{citation.documentName || 'Unknown Document'}</h3>
              <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                <span>Chunk #{citation.chunkIndex !== undefined ? citation.chunkIndex : 'N/A'}</span>
                <span>Relevance: {(citation.similarityScore * 100).toFixed(1)}%</span>
                {(citation as any).page && <span>Page: {(citation as any).page}</span>}
              </div>
            </div>
            
            <Link 
              href={`/documents/${citation.documentId}`}
              target="_blank"
              className="text-sm flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Document
            </Link>
          </div>

          <div className="flex-1 overflow-hidden border rounded-lg bg-card">
            <ScrollArea className="h-full">
              <div className="p-4 prose prose-sm md:prose-base dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{citation.text}</p>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
