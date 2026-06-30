import React, { useEffect, useRef } from 'react';
import { Message } from '@ai-sdk/react';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onTogglePin?: (messageId: string, currentStatus: boolean) => void;
}

export function MessageList({ messages, isLoading, onTogglePin }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <span className="text-3xl">📚</span>
        </div>
        <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
        <p className="text-muted-foreground max-w-sm">
          Ask me questions about your uploaded documents, course materials, and notes. I will provide answers backed by accurate citations.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 w-full max-w-2xl">
          <div className="p-4 border rounded-xl bg-card text-left text-sm hover:border-primary/50 cursor-pointer transition-colors">
            "Summarize the key points from Lecture 4."
          </div>
          <div className="p-4 border rounded-xl bg-card text-left text-sm hover:border-primary/50 cursor-pointer transition-colors">
            "What is the formula for calculating velocity?"
          </div>
          <div className="p-4 border rounded-xl bg-card text-left text-sm hover:border-primary/50 cursor-pointer transition-colors">
            "Explain the concept of inheritance in Java."
          </div>
          <div className="p-4 border rounded-xl bg-card text-left text-sm hover:border-primary/50 cursor-pointer transition-colors">
            "Find notes about the French Revolution."
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col min-h-full pb-8">
        {messages.map((message) => {
          // Parse citations if they exist. In Vercel AI SDK, we can pass them in the response headers 
          // and they are attached to annotations or we can just assume they come separately. 
          // For now, we will extract them from message.annotations if available.
          const citations = message.annotations ? (message.annotations as any[]) : [];
          const isPinned = (message as any).isPinned || false;
          const confidenceScores = (message as any).confidenceScores;

          return (
            <MessageBubble 
              key={message.id} 
              message={message} 
              citations={citations} 
              isPinned={isPinned}
              confidenceScores={confidenceScores}
              onTogglePin={onTogglePin ? () => onTogglePin(message.id, isPinned) : undefined}
            />
          );
        })}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex px-4 py-6 justify-start border-y border-border/50 bg-muted/20">
            <div className="flex gap-4 max-w-4xl w-full mx-auto">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shrink-0">
                <span className="animate-pulse">●</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-px" />
      </div>
    </div>
  );
}
