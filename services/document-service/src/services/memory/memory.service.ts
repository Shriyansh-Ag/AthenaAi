import { MessageModel, IMessage } from '../../models/message.model';
import { ConversationSummaryModel, IConversationSummary } from '../../models/conversation-summary.model';
import { MemoryIndexModel, IMemoryIndex } from '../../models/memory-index.model';

export class MemoryService {
  /**
   * Toggles the pin status of a message. Pinned messages are always retained in context.
   */
  async togglePinMessage(messageId: string, isPinned: boolean): Promise<IMessage | null> {
    return MessageModel.findByIdAndUpdate(
      messageId,
      { $set: { isPinned } },
      { new: true }
    ).exec() as unknown as IMessage | null;
  }

  /**
   * Retrieves all pinned messages for a conversation.
   */
  async getPinnedMessages(conversationId: string): Promise<IMessage[]> {
    return MessageModel.find({ conversationId, isPinned: true })
      .sort({ createdAt: 1 })
      .exec() as unknown as IMessage[];
  }

  /**
   * Clears the conversational memory (Summary and Memory Index).
   */
  async clearMemory(conversationId: string): Promise<void> {
    await ConversationSummaryModel.deleteMany({ conversationId });
    await MemoryIndexModel.deleteMany({ conversationId });
    
    // Also unpin all messages in the conversation to reset state fully
    await MessageModel.updateMany(
      { conversationId, isPinned: true },
      { $set: { isPinned: false } }
    );
  }

  /**
   * Gets the conversation summary if it exists.
   */
  async getConversationSummary(conversationId: string): Promise<IConversationSummary | null> {
    return ConversationSummaryModel.findOne({ conversationId }).exec() as unknown as IConversationSummary | null;
  }

  /**
   * Upserts the conversation summary.
   */
  async upsertConversationSummary(conversationId: string, summary: string, lastMessageId: string): Promise<void> {
    await ConversationSummaryModel.findOneAndUpdate(
      { conversationId },
      { $set: { summary, lastMessageId } },
      { upsert: true, new: true }
    );
  }

  /**
   * Adds a block of memory to the memory index for semantic/keyword retrieval later.
   */
  async addMemoryToIndex(conversationId: string, content: string, messageIds: string[]): Promise<void> {
    await MemoryIndexModel.create({
      conversationId,
      content,
      messageIds
    });
  }

  /**
   * Performs a keyword/text search on the memory index for a conversation.
   */
  async searchMemory(conversationId: string, query: string, limit: number = 3): Promise<IMemoryIndex[]> {
    if (!query) return [];
    
    return MemoryIndexModel.find(
      { conversationId, $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .exec() as unknown as IMemoryIndex[];
  }
}
