import { StateGraph, END, START, MemorySaver } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { 
  INTENT_DETECTION_PROMPT, 
  REASONING_PROMPT, 
  ANSWER_PROMPT, 
  EXAMPLES_PROMPT, 
  FOLLOWUP_PROMPT 
} from './prompt.templates';

// We interface with existing services
import { DocumentService } from '../document.service';
import { MemoryManager } from '../memory/memory.manager';
import { CitationService } from '../rag/citation.service';
import { ICitation } from '../../models/message.model';

// Define the state interface for the graph
export interface TutorState {
  userId: string;
  conversationId: string;
  question: string;
  filters?: any;
  
  intent?: string;
  contextText?: string;
  citations?: ICitation[];
  memoryContext?: any[];
  
  reasoning?: string;
  answer?: string;
  examples?: string;
  followUps?: string[];
  
  // Model injection
  modelProvider?: string;
  modelId?: string;
}

export class TutorAgent {
  private citationService: CitationService;
  
  constructor(
    private documentService: DocumentService,
    private memoryManager: MemoryManager
  ) {
    this.citationService = new CitationService();
  }

  // Utility to get the right LangChain model based on provider strings
  private getChatModel(provider: string = 'openai', modelId: string = 'gpt-4o-mini', streaming: boolean = false): BaseChatModel {
    // For simplicity, assuming OpenAI. In a real scenario, map provider string to ChatOpenAI, ChatAnthropic, etc.
    return new ChatOpenAI({
      modelName: modelId,
      temperature: 0.3,
      streaming: streaming
    });
  }

  public createGraph() {
    const graphBuilder = new StateGraph<TutorState>({
      channels: {
        userId: { value: (a, b) => b ?? a },
        conversationId: { value: (a, b) => b ?? a },
        question: { value: (a, b) => b ?? a },
        filters: { value: (a, b) => b ?? a },
        intent: { value: (a, b) => b ?? a },
        contextText: { value: (a, b) => b ?? a },
        citations: { value: (a, b) => b ?? a },
        memoryContext: { value: (a, b) => b ?? a },
        reasoning: { value: (a, b) => b ?? a },
        answer: { value: (a, b) => b ?? a },
        examples: { value: (a, b) => b ?? a },
        followUps: { value: (a, b) => b ?? a },
        modelProvider: { value: (a, b) => b ?? a },
        modelId: { value: (a, b) => b ?? a },
      }
    });

    // 1. Detect Intent
    graphBuilder.addNode('detectIntent', async (state) => {
      const model = (this.getChatModel(state.modelProvider, state.modelId) as any).bind({ response_format: { type: 'json_object' } });
      const prompt = PromptTemplate.fromTemplate(INTENT_DETECTION_PROMPT);
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const res = await chain.invoke({ question: state.question });
      try {
        const parsed = JSON.parse(res);
        return { intent: parsed.intent || 'chat' };
      } catch (e) {
        return { intent: 'chat' };
      }
    });

    // 2. Retrieve Context
    graphBuilder.addNode('retrieveContext', async (state) => {
      const results = await this.documentService.search(
        state.userId,
        state.question,
        'hybrid',
        state.filters,
        1,
        5
      );

      if (!results || results.length === 0) {
        return { contextText: '', citations: [] };
      }

      const citations = await this.citationService.buildCitations(results);
      let contextText = '';
      citations.forEach((citation, index) => {
        contextText += `\n--- Source [${index + 1}] ---\n`;
        contextText += `Document: ${citation.documentName}\n`;
        contextText += `Text:\n${citation.text}\n`;
      });

      return { contextText, citations };
    });

    // 2.5 Retrieve Conversation
    graphBuilder.addNode('retrieveConversation', async (state) => {
      // In a real implementation we would fetch actual history from repository and use MemoryManager
      // For this step, we'll mock the extraction or assume memoryManager builds a string summary
      const memoryContext: any[] = [];
      return { memoryContext };
    });

    // 3. Reason
    graphBuilder.addNode('reason', async (state) => {
      const model = this.getChatModel(state.modelProvider, state.modelId);
      const prompt = PromptTemplate.fromTemplate(REASONING_PROMPT);
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const reasoning = await chain.invoke({
        intent: state.intent,
        context: state.contextText || 'No context',
        question: state.question
      });
      return { reasoning };
    });

    // 4. Answer (This node streams output via runnables but here we just return it or use streamEvents downstream)
    graphBuilder.addNode('answer', async (state) => {
      const model = this.getChatModel(state.modelProvider, state.modelId, true);
      const prompt = PromptTemplate.fromTemplate(ANSWER_PROMPT);
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      // We can stream this from the outside by looking at events, so we just invoke it here
      const answer = await chain.invoke({
        intent: state.intent,
        reasoning: state.reasoning,
        context: state.contextText || 'No context found.',
        question: state.question
      });
      return { answer };
    });

    // 5. Generate FollowUps
    graphBuilder.addNode('generateFollowUps', async (state) => {
      const model = this.getChatModel(state.modelProvider, state.modelId);
      const prompt = PromptTemplate.fromTemplate(FOLLOWUP_PROMPT);
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const followUpsRaw = await chain.invoke({});
      const followUps = followUpsRaw.split('\n').map(q => q.replace(/^- /, '').trim()).filter(q => q.length > 0);
      return { followUps };
    });

    // Edges
    // @ts-ignore
    graphBuilder.addEdge(START, 'detectIntent');
    // @ts-ignore
    graphBuilder.addEdge('detectIntent', 'retrieveContext');
    // @ts-ignore
    graphBuilder.addEdge('retrieveContext', 'retrieveConversation');
    // @ts-ignore
    graphBuilder.addEdge('retrieveConversation', 'reason');
    // @ts-ignore
    graphBuilder.addEdge('reason', 'answer');
    // @ts-ignore
    graphBuilder.addEdge('answer', 'generateFollowUps');
    // @ts-ignore
    graphBuilder.addEdge('generateFollowUps', END);

    return graphBuilder.compile();
  }
}
