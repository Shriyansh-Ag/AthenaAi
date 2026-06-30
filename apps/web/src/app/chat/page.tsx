'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { ChatSidebar } from '@/components/features/chat/ChatSidebar';
import { MessageList } from '@/components/features/chat/MessageList';
import { ChatInput } from '@/components/features/chat/ChatInput';
import { chatApi } from '@/lib/chat';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ChatPage() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize Vercel AI useChat
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    stop, 
    reload, 
    setMessages,
    error 
  } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'}/api/chat/stream`,
    body: {
      conversationId: currentConversationId,
      data: {
        provider: 'openai',
        modelId: 'gpt-4o-mini'
      }
    },
    onResponse: (response: Response) => {
      // Custom headers handling if backend sends citations in header
      const citationsHeader = response.headers.get('X-Citations');
      if (citationsHeader) {
        try {
          const citations = JSON.parse(atob(citationsHeader));
          // Note: In a real app we might attach this to the latest message.
          // For simplicity, ai sdk automatically passes headers or we can use onFinish
        } catch (e) {
          console.error("Failed to parse citations");
        }
      }
    },
    onFinish: (message: any) => {
      // Handle finish if necessary
    }
  });

  // Load conversation history when switching conversations
  useEffect(() => {
    if (currentConversationId) {
      chatApi.getMessages(currentConversationId).then((history) => {
        // Map backend history to ai/react Message format
        const aiMessages = history.map(m => ({
          id: m._id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          annotations: m.citations,
          isPinned: m.isPinned,
          confidenceScores: m.confidenceScores
        }));
        setMessages(aiMessages);
      }).catch(err => {
        console.error("Failed to load messages", err);
        setMessages([]);
      });
    } else {
      setMessages([]);
    }
  }, [currentConversationId, setMessages]);

  const handleSelectConversation = (id: string) => {
    if (id !== currentConversationId) {
      setCurrentConversationId(id);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await chatApi.createConversation('New Conversation');
      setCurrentConversationId(newConv._id);
    } catch (err) {
      console.error("Failed to create conversation", err);
    }
  };

  const handleTogglePin = async (messageId: string, currentStatus: boolean) => {
    if (!currentConversationId) return;
    try {
      await chatApi.pinMessage(currentConversationId, messageId, !currentStatus);
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, isPinned: !currentStatus } as any : m
      ));
    } catch (err) {
      console.error("Failed to toggle pin", err);
    }
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden shrink-0 hidden md:block border-r`}>
        <ChatSidebar 
          currentConversationId={currentConversationId} 
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b bg-background/80 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex">
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">AthenaAI Tutor</h1>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to Dashboard
          </Link>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 text-center border-b border-destructive/20 shrink-0">
            {error.message || 'An error occurred while generating the response.'}
          </div>
        )}

        {/* Message List */}
        <MessageList messages={messages} isLoading={isLoading} onTogglePin={handleTogglePin} />

        {/* Input Area */}
        <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent pt-6">
          <ChatInput 
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            reload={reload}
            messagesLength={messages.length}
          />
        </div>
      </div>
    </div>
  );
}
