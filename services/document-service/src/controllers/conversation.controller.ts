import { Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversation.service';
import type { AuthenticatedRequest } from '../types';

export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  getConversations = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversations = await this.conversationService.getConversations(userId);
      res.status(200).json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      const messages = await this.conversationService.getMessages(userId, conversationId);
      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  };

  createConversation = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { title } = req.body;
      const conversation = await this.conversationService.createConversation(userId, title || 'New Conversation');
      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  };

  renameConversation = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      const { title } = req.body;
      const conversation = await this.conversationService.renameConversation(userId, conversationId, title);
      res.status(200).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  };

  deleteConversation = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      await this.conversationService.deleteConversation(userId, conversationId);
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  pinMessage = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      const messageId = req.params.msgId as string;
      const { isPinned } = req.body;
      const message = await this.conversationService.pinMessage(userId, conversationId, messageId, !!isPinned);
      res.status(200).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  };

  clearMemory = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      await this.conversationService.clearMemory(userId, conversationId);
      res.status(200).json({ success: true, message: 'Memory cleared successfully' });
    } catch (error) {
      next(error);
    }
  };

  streamChat = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      // Vercel AI SDK expects `messages` array in the request body
      const { messages, conversationId, data } = req.body;
      
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        res.status(400).json({ error: 'Last message must be from user' });
        return;
      }

      const filters = data?.filters || {};
      const provider = data?.provider || 'openai';
      const modelId = data?.modelId || 'gpt-4o-mini';

      const { streamResult, citations } = await this.conversationService.streamChat(
        userId,
        conversationId || 'new',
        lastMessage.content,
        provider,
        modelId,
        filters
      );

      // Pipe the stream back to the client
      streamResult.pipeTextStreamToResponse(res, {
        headers: {
          'X-Citations': Buffer.from(JSON.stringify(citations)).toString('base64')
        }
      });
      
    } catch (error) {
      next(error);
    }
  };
}
