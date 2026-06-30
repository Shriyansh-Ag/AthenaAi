import { MemoryService } from './memory.service';
import { IMessage } from '../../models/message.model';

export class Retriever {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = new MemoryService();
  }

  /**
   * Fetches context components for a conversation
   */
  async retrieveContext(conversationId: string, currentQuery: string) {
    // 1. Get pinned messages
    const pinnedMessages = await this.memoryService.getPinnedMessages(conversationId);
    
    // 2. Get conversation summary
    const summary = await this.memoryService.getConversationSummary(conversationId);
    
    // 3. Get relevant memories from index (keyword search based on current query)
    const relevantMemories = await this.memoryService.searchMemory(conversationId, currentQuery);
    
    return {
      pinnedMessages,
      summary: summary?.summary || null,
      lastSummarizedMessageId: summary?.lastMessageId || null,
      relevantMemories
    };
  }
}
