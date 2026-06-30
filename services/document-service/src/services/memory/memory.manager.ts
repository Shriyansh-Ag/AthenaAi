import { IMessage } from '../../models/message.model';
import { Retriever } from './retriever';
import { Summarizer } from './summarizer';
import { MemoryService } from './memory.service';
import { LLMProviderType } from '../llm/llm.provider';

// Rough heuristic: 1 word ~ 1.3 tokens
const estimateTokens = (text: string) => Math.ceil((text.split(/\s+/).length) * 1.3);

export class MemoryManager {
  private retriever: Retriever;
  private summarizer: Summarizer;
  public memoryService: MemoryService;
  
  // Strict token budget for conversation history
  private readonly MAX_HISTORY_TOKENS = 2500;
  // Trigger summary when unsummarized tokens exceed this
  private readonly SUMMARY_THRESHOLD_TOKENS = 1500;

  constructor() {
    this.retriever = new Retriever();
    this.summarizer = new Summarizer();
    this.memoryService = new MemoryService();
  }

  /**
   * Orchestrates the construction of the context window for the LLM.
   * Compresses history if it exceeds limits and retrieves relevant memories.
   */
  async buildContextWindow(
    conversationId: string, 
    rawMessages: IMessage[], 
    currentQuery: string,
    provider: LLMProviderType,
    modelId: string
  ): Promise<any[]> {
    const contextMessages: any[] = [];
    
    // 1. Retrieve static contexts
    const { 
      pinnedMessages, 
      summary, 
      lastSummarizedMessageId, 
      relevantMemories 
    } = await this.retriever.retrieveContext(conversationId, currentQuery);

    // 2. Identify unsummarized recent messages
    let unsummarizedMessages: IMessage[] = [];
    if (lastSummarizedMessageId) {
      const idx = rawMessages.findIndex(m => m._id.toString() === lastSummarizedMessageId.toString());
      if (idx !== -1) {
        unsummarizedMessages = rawMessages.slice(idx + 1);
      } else {
        // Fallback if message not found
        unsummarizedMessages = rawMessages;
      }
    } else {
      unsummarizedMessages = rawMessages;
    }

    // Exclude pinned messages from unsummarized calculation to avoid duplication
    // if we plan to inject them separately, but typically we just keep them in the stream.
    // Actually, pinned messages should be forcefully included, even if they are old.
    
    // Calculate tokens for unsummarized messages
    const unsummarizedTokens = unsummarizedMessages.reduce(
      (acc, m) => acc + estimateTokens(m.content), 0
    );

    // 3. Trigger Summarization if needed (Async or Sync)
    // If the unsummarized messages exceed the threshold, we summarize them
    let activeSummary = summary;
    let recentMessagesToInclude = unsummarizedMessages;

    if (unsummarizedTokens > this.SUMMARY_THRESHOLD_TOKENS && unsummarizedMessages.length > 2) {
      // Keep the last 2 messages as raw context, summarize the rest
      const messagesToSummarize = unsummarizedMessages.slice(0, -2);
      recentMessagesToInclude = unsummarizedMessages.slice(-2);
      
      // Perform summarization
      const newSummary = await this.summarizer.summarize(
        messagesToSummarize, 
        activeSummary, 
        provider, 
        modelId
      );
      
      // Save to DB
      const lastSummarizedId = messagesToSummarize[messagesToSummarize.length - 1]._id.toString();
      await this.memoryService.upsertConversationSummary(conversationId, newSummary, lastSummarizedId);
      
      // Update active summary for this run
      activeSummary = newSummary;

      // Also add this chunk of messages to the MemoryIndex for keyword search later
      const contentToIndex = messagesToSummarize.map(m => m.content).join(' ');
      await this.memoryService.addMemoryToIndex(
        conversationId, 
        contentToIndex, 
        messagesToSummarize.map(m => m._id.toString())
      );
    }

    // 4. Build the final context array for the AI
    // Format:
    // - System message containing Summary + Relevant Memories
    // - Pinned Messages (interleaved or as system instructions)
    // - Recent Messages

    let systemContext = ``;
    
    if (activeSummary) {
      systemContext += `[Conversation Summary]\n${activeSummary}\n\n`;
    }

    if (relevantMemories.length > 0) {
      systemContext += `[Relevant Past Context]\n`;
      relevantMemories.forEach(rm => {
        systemContext += `- ${rm.content}\n`;
      });
      systemContext += `\n`;
    }

    if (systemContext.trim()) {
      contextMessages.push({
        role: 'system',
        content: `You have access to the following long-term memory for this conversation:\n${systemContext}`
      });
    }

    // Add Pinned Messages
    // We treat pinned messages as system reminders if they are old, or just re-inject them.
    // For simplicity, we add them as distinct assistant/user messages but mark them.
    const pinnedSet = new Set(pinnedMessages.map(p => p._id.toString()));
    
    pinnedMessages.forEach(pm => {
      contextMessages.push({
        role: pm.role as 'user' | 'assistant' | 'system',
        content: `[PINNED MESSAGE] ${pm.content}`
      });
    });

    // Add Recent Messages
    recentMessagesToInclude.forEach(rm => {
      if (!pinnedSet.has(rm._id.toString())) {
        contextMessages.push({
          role: rm.role as 'user' | 'assistant' | 'system',
          content: rm.content
        });
      }
    });

    return contextMessages;
  }
}
