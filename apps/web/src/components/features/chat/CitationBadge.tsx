import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Maximize2 } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SourceViewerModal } from './SourceViewerModal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Citation {
  documentId: string;
  documentName?: string;
  chunkId: string;
  chunkIndex?: number;
  similarityScore: number;
  text: string;
}

interface CitationBadgeProps {
  citation: Citation;
  index: number;
  inline?: boolean;
}

export function CitationBadge({ citation, index, inline = false }: CitationBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <HoverCard>
        {/* @ts-ignore */}
        <HoverCardTrigger asChild>
          <span 
            className={cn(
              "inline-flex items-center cursor-pointer transition-colors",
              inline ? "mx-0.5" : "mx-1"
            )}
            onClick={() => setModalOpen(true)}
          >
            <Badge 
              variant="outline" 
              className={cn(
                "font-mono bg-background hover:bg-accent border-primary/30 text-primary",
                inline ? "h-4 px-1 text-[10px] -translate-y-1" : "h-5 px-1.5 text-xs"
              )}
            >
              [{index + 1}]
            </Badge>
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4 z-50" align="start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-sm overflow-hidden">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{citation.documentName || 'Unknown Document'}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setModalOpen(true)}>
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Relevance Score: {(citation.similarityScore * 100).toFixed(1)}%
              {(citation as any).page && ` • Page ${(citation as any).page}`}
            </div>
            <p className="text-xs italic border-l-2 pl-2 border-primary/50 text-foreground/80 line-clamp-4 mt-1">
              "{citation.text}"
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>

      <SourceViewerModal 
        citation={citation}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
