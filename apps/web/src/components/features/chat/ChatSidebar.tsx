import { useState } from 'react';
import { Conversation, chatApi } from '@/lib/chat';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatSidebarProps {
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ChatSidebar({ currentConversationId, onSelect, onNew }: ChatSidebarProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
  });

  const renameMutation = useMutation({
    mutationFn: (data: { id: string, title: string }) => chatApi.renameConversation(data.id, data.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setEditingId(null);
      toast.success('Conversation renamed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (currentConversationId === deletedId) {
        onNew();
      }
      toast.success('Conversation deleted');
    }
  });

  const startEdit = (conv: Conversation) => {
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      renameMutation.mutate({ id, title: editTitle.trim() });
    } else {
      setEditingId(null);
    }
  };

  return (
    <div className="w-72 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onNew} className="w-full justify-start gap-2" variant="outline">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground mt-4">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground mt-4">No conversations yet.</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              className={cn(
                "group flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer transition-colors text-sm",
                currentConversationId === conv._id && "bg-accent"
              )}
              onClick={() => {
                if (editingId !== conv._id) {
                  onSelect(conv._id);
                }
              }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                {editingId === conv._id ? (
                  <Input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(conv._id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(conv._id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="h-7 text-xs px-2 py-0"
                  />
                ) : (
                  <span className="truncate">{conv.title}</span>
                )}
              </div>

              {editingId !== conv._id && (
                <DropdownMenu>
                  {/* @ts-ignore */}
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startEdit(conv); }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        chatApi.clearMemory(conv._id)
                          .then(() => toast.success('Memory cleared for this chat'))
                          .catch(() => toast.error('Failed to clear memory')); 
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Memory
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(conv._id); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
