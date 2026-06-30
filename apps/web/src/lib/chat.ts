import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'}/api`,
  withCredentials: true,
});

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  status: string;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: any[];
  createdAt: string;
}

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get('/chat');
    return res.data.data;
  },

  getMessages: async (id: string): Promise<Message[]> => {
    const res = await apiClient.get(`/chat/${id}/messages`);
    return res.data.data;
  },

  createConversation: async (title?: string): Promise<Conversation> => {
    const res = await apiClient.post('/chat', { title });
    return res.data.data;
  },

  renameConversation: async (id: string, title: string): Promise<Conversation> => {
    const res = await apiClient.patch(`/chat/${id}`, { title });
    return res.data.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/chat/${id}`);
  },

  pinMessage: async (conversationId: string, messageId: string, isPinned: boolean): Promise<void> => {
    await apiClient.put(`/chat/${conversationId}/messages/${messageId}/pin`, { isPinned });
  },

  clearMemory: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/chat/${conversationId}/memory`);
  }
};
