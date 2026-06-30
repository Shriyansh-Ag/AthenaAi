import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop: () => void;
  reload: () => void;
  messagesLength: number;
}

export function ChatInput({ 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading, 
  stop, 
  reload,
  messagesLength 
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mb-4 h-10">
        {isLoading ? (
          <Button variant="outline" size="sm" onClick={stop} className="rounded-full shadow-sm">
            <Square className="w-4 h-4 mr-2 fill-current" />
            Stop Generating
          </Button>
        ) : messagesLength > 0 ? (
          <Button variant="outline" size="sm" onClick={reload} className="rounded-full shadow-sm text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate response
          </Button>
        ) : null}
      </div>

      <form 
        onSubmit={handleSubmit}
        className="relative flex flex-col bg-background border rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary overflow-hidden"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          placeholder="Ask a question about your documents..."
          className="min-h-[56px] max-h-[200px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-4 py-4 text-base sm:text-sm pr-14"
          rows={1}
        />
        
        <div className="absolute right-2 bottom-2">
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className={cn(
              "h-8 w-8 rounded-full transition-transform",
              input.trim() && !isLoading ? "bg-primary text-primary-foreground scale-100" : "bg-muted text-muted-foreground scale-95"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      
      <div className="text-center mt-2">
        <p className="text-xs text-muted-foreground">
          AthenaAI can make mistakes. Always verify information using the provided citations.
        </p>
      </div>
    </div>
  );
}
