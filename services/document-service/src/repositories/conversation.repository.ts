import { ConversationModel, IConversation } from '../models/conversation.model';
import { MessageModel, IMessage } from '../models/message.model';

export class ConversationRepository {
  // Conversations
  async createConversation(userId: string, title: string): Promise<IConversation> {
    const conversation = new ConversationModel({ userId, title });
    return conversation.save();
  }

  async findConversationsByUserId(userId: string): Promise<IConversation[]> {
    return ConversationModel.find({ userId, status: 'active' })
      .sort({ updatedAt: -1 })
      .exec() as unknown as IConversation[];
  }

  async findConversationById(id: string, userId: string): Promise<IConversation | null> {
    return ConversationModel.findOne({ _id: id, userId, status: 'active' }).exec() as unknown as IConversation | null;
  }

  async updateConversationTitle(id: string, userId: string, title: string): Promise<IConversation | null> {
    return ConversationModel.findOneAndUpdate(
      { _id: id, userId, status: 'active' },
      { $set: { title } },
      { new: true }
    ) as unknown as IConversation | null;
  }

  async deleteConversation(id: string, userId: string): Promise<boolean> {
    const result = await ConversationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status: 'deleted' } }
    );
    return !!result;
  }

  // Messages
  async addMessage(
    conversationId: string, 
    role: 'user' | 'assistant' | 'system', 
    content: string, 
    citations?: any[],
    confidenceScores?: any
  ): Promise<IMessage> {
    const message = new MessageModel({
      conversationId,
      role,
      content,
      citations,
      confidenceScores
    });
    
    // Update conversation updatedAt
    await ConversationModel.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
    
    return message.save();
  }

  async findMessagesByConversationId(conversationId: string): Promise<IMessage[]> {
    return MessageModel.find({ conversationId })
      .sort({ createdAt: 1 })
      .exec() as unknown as IMessage[];
  }

  async deleteMessages(conversationId: string): Promise<void> {
    await MessageModel.deleteMany({ conversationId });
  }
}
