import { DocumentService } from '../document.service';
import { MemoryManager } from '../memory/memory.manager';

// LangChain tools expect a function or a Tool class. For LangGraph, simple async functions are perfectly fine.

export async function retrieveContextTool(
  documentService: DocumentService, 
  userId: string, 
  query: string, 
  filters?: any
) {
  return await documentService.search(userId, query, 'hybrid', filters, 1, 5);
}

import { LLMProviderType } from '../llm/llm.provider';

export async function retrieveMemoryTool(
  memoryManager: MemoryManager,
  conversationId: string,
  history: any[],
  currentMessage: string,
  provider: string,
  modelId: string
) {
  return await memoryManager.buildContextWindow(conversationId, history, currentMessage, provider as LLMProviderType, modelId);
}
