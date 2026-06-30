import { streamText } from 'ai';
import { ConversationRepository } from '../repositories/conversation.repository';
import { RAGOrchestrator } from './rag/rag.orchestrator';
import { LLMProviderFactory, LLMProviderType } from './llm/llm.provider';
import { PromptLogModel } from '../models/prompt-log.model';

import { MemoryManager } from './memory/memory.manager';
import { TutorAgent } from './tutor/tutor.agent';
import { DocumentService } from './document.service';

export class ConversationService {
  private memoryManager: MemoryManager;
  private tutorAgent: TutorAgent;

  constructor(
    private conversationRepository: ConversationRepository,
    private ragOrchestrator: RAGOrchestrator,
    private documentService: DocumentService
  ) {
    this.memoryManager = new MemoryManager();
    this.tutorAgent = new TutorAgent(this.documentService, this.memoryManager);
  }

  async createConversation(userId: string, title: string) {
    return this.conversationRepository.createConversation(userId, title);
  }

  async getConversations(userId: string) {
    return this.conversationRepository.findConversationsByUserId(userId);
  }

  async getMessages(userId: string, conversationId: string) {
    // Validate conversation belongs to user
    const conv = await this.conversationRepository.findConversationById(conversationId, userId);
    if (!conv) {
      throw new Error('Conversation not found');
    }
    return this.conversationRepository.findMessagesByConversationId(conversationId);
  }

  async renameConversation(userId: string, conversationId: string, title: string) {
    return this.conversationRepository.updateConversationTitle(conversationId, userId, title);
  }

  async deleteConversation(userId: string, conversationId: string) {
    return this.conversationRepository.deleteConversation(conversationId, userId);
  }

  async pinMessage(userId: string, conversationId: string, messageId: string, isPinned: boolean) {
    // Validate conversation exists and belongs to user
    const conv = await this.conversationRepository.findConversationById(conversationId, userId);
    if (!conv) {
      throw new Error('Conversation not found');
    }
    return this.memoryManager.memoryService.togglePinMessage(messageId, isPinned);
  }

  async clearMemory(userId: string, conversationId: string) {
    const conv = await this.conversationRepository.findConversationById(conversationId, userId);
    if (!conv) {
      throw new Error('Conversation not found');
    }
    return this.memoryManager.memoryService.clearMemory(conversationId);
  }

  /**
   * Handles a new user message and streams the AI response back.
   * This should be called by a controller that pipes the Node Response.
   */
  async streamChat(
    userId: string,
    conversationId: string,
    message: string,
    provider: LLMProviderType = 'openai',
    modelId: string = 'gpt-4o-mini',
    filters?: { course?: string; tags?: string[] }
  ): Promise<{ streamResult: any; citations: any[] }> {
    // 1. Validate conversation
    let conv = await this.conversationRepository.findConversationById(conversationId, userId);
    if (!conv) {
      // Auto-create if it doesn't exist
      conv = await this.conversationRepository.createConversation(userId, 'New Conversation');
      conversationId = conv._id.toString();
    }

    // 2. Save User Message
    await this.conversationRepository.addMessage(conversationId, 'user', message);

    // 3. Fetch Previous Messages for Conversation History
    const history = await this.conversationRepository.findMessagesByConversationId(conversationId);

    // 4. Execute TutorAgent Graph
    const graph = this.tutorAgent.createGraph();
    const initialState = {
      userId,
      conversationId,
      question: message,
      filters,
      modelProvider: provider,
      modelId,
      history: history // Include history in the state
    };

    // We will collect the final state internally as it streams, to save the DB
    let citations: any[] = [];
    let finalAnswer = '';
    
    // We create a mock pipeTextStreamToResponse interface that Vercel AI SDK controller expects
    const pipeTextStreamToResponse = async (res: any, options: any) => {
      // Send standard text headers
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      if (options?.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          res.setHeader(key, value as string);
        }
      }

      try {
        const stream = await graph.streamEvents(initialState, { version: 'v2' });
        for await (const event of stream) {
          // We look for ChatModel streaming events from the 'answer' node
          if (event.event === 'on_chat_model_stream') {
            const chunk = event.data?.chunk?.content;
            if (chunk) {
              finalAnswer += chunk;
              res.write(chunk);
            }
          }
          
          // Capture citations when context is retrieved
          if (event.event === 'on_chain_end' && event.name === 'retrieveContext') {
             if (event.data?.output?.citations) {
               citations = event.data.output.citations;
             }
          }
        }

        res.end();

        // Finish processing
        const confidenceCalculator = new (require('./rag/confidence.calculator').ConfidenceCalculator)();
        const confidenceScores = confidenceCalculator.calculateConfidence(finalAnswer, citations);

        await this.conversationRepository.addMessage(
          conversationId, 
          'assistant', 
          finalAnswer,
          citations,
          confidenceScores
        );

        if (history.length <= 2) {
          const newTitle = message.length > 30 ? message.substring(0, 30) + '...' : message;
          await this.conversationRepository.updateConversationTitle(conversationId, userId, newTitle);
        }

      } catch (err) {
        console.error('Stream error:', err);
        res.end();
      }
    };

    // To pass citations in the header *before* we start streaming, we might need a two-pass 
    // or just execute context retrieval first. However, LangGraph streamEvents will emit it later.
    // Wait, the controller does: `streamResult.pipeTextStreamToResponse(res, { headers: { 'X-Citations': ... citations ... }})`
    // It assumes citations are available synchronously BEFORE streaming.
    // Let's manually run the retrieval step first to get citations, or just let LangGraph do it 
    // but the controller needs citations immediately.
    // Actually, we can just execute `retrieveContext` node manually, OR pre-fetch citations here:
    const { contextText, citations: preCitations } = await this.ragOrchestrator.buildContext(userId, message, filters);
    (initialState as any).contextText = contextText;
    (initialState as any).citations = preCitations;

    return {
      streamResult: {
        pipeTextStreamToResponse
      },
      citations: preCitations
    };
  }
}
