import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // or your preferred theme
import { cn } from '@/lib/utils';
import { CitationBadge } from './CitationBadge';
import { Bot, User, Check, Copy, Pin } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Message } from '@ai-sdk/react';

interface MessageBubbleProps {
  message: Message;
  citations?: any[];
  isPinned?: boolean;
  confidenceScores?: any;
  onTogglePin?: () => void;
}

export function MessageBubble({ message, citations, isPinned = false, confidenceScores, onTogglePin }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processContent = (content: string) => {
    // Replace [1], [2], etc., with markdown links to hook into the 'a' component
    return content.replace(/\[(\d+)\]/g, '[$1](#cite-$1)');
  };

  const processedContent = isUser ? message.content : processContent(message.content);

  const getConfidenceBadge = (scores: any) => {
    if (!scores) return null;
    const { overall } = scores;
    let label = 'High Confidence';
    let colorClass = 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    if (overall < 0.6) {
      label = 'Low Confidence';
      colorClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    } else if (overall < 0.8) {
      label = 'Medium Confidence';
      colorClass = 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    }
    
    return (
      <div className={cn("text-[10px] px-2 py-0.5 rounded-full border ml-2 font-medium flex items-center", colorClass)} title={`Source: ${scores.source}, Grounding: ${scores.hallucination}`}>
        {label} {(overall * 100).toFixed(0)}%
      </div>
    );
  };

  return (
    <div className={cn(
      "flex w-full px-4 py-6 hover:bg-muted/10 transition-colors",
      isUser ? "justify-end" : "justify-start border-y border-border/50 bg-muted/20"
    )}>
      <div className={cn(
        "flex gap-4 max-w-4xl w-full mx-auto",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-blue-600 text-white shadow-sm"
        )}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>

        {/* Content */}
        <div className={cn(
          "flex flex-col gap-2 max-w-[85%]",
          isUser ? "items-end" : "items-start"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-muted-foreground">{isUser ? 'You' : 'AthenaAI'}</span>
            {!isUser && getConfidenceBadge(confidenceScores || (message as any).data?.confidenceScores)}
          </div>
          
          <div className={cn(
            "prose prose-sm md:prose-base dark:prose-invert max-w-none break-words",
            isUser ? "bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-sm" : ""
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight as any]}
              components={{
                a: ({ node, href, children, ...props }) => {
                  if (href?.startsWith('#cite-')) {
                    const indexStr = href.replace('#cite-', '');
                    const idx = parseInt(indexStr, 10) - 1;
                    if (citations && citations[idx]) {
                      return <CitationBadge citation={citations[idx]} index={idx} inline={true} />;
                    }
                    return <sup className="text-muted-foreground font-mono">[{indexStr}]</sup>;
                  }
                  return <a href={href} {...props} target="_blank" rel="noopener noreferrer">{children}</a>;
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
          
          {/* Citations block for assistant messages */}
          {!isUser && citations && citations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50 w-full flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Sources:</span>
              {citations.map((cit, idx) => (
                <CitationBadge key={`${cit.chunkId}-${idx}`} citation={cit} index={idx} />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={copyToClipboard} title="Copy Message">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            {onTogglePin && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-6 w-6", 
                  isPinned ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"
                )} 
                onClick={onTogglePin}
                title={isPinned ? "Unpin Memory" : "Pin to Memory"}
              >
                <Pin className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
