import { generateText } from 'ai';
import { LLMProviderFactory, LLMProviderType } from '../llm/llm.provider';
import { IMessage } from '../../models/message.model';

export class Summarizer {


  /**
   * Summarizes a block of messages and combines it with a previous summary (if any).
   */
  async summarize(
    messages: IMessage[], 
    previousSummary: string | null = null,
    provider: LLMProviderType = 'openai',
    modelId: string = 'gpt-4o-mini'
  ): Promise<string> {
    const aiModel = LLMProviderFactory.getModel(provider, modelId);
    
    // Format messages for the summarization prompt
    const formattedMessages = messages.map(m => 
      `${m.role.toUpperCase()}: ${m.content}`
    ).join('\n\n');

    let prompt = `You are a memory condensation AI. Your task is to summarize the following conversation history.
Keep it concise but retain ALL critical facts, preferences, constraints, and decisions.

Conversation History:
${formattedMessages}
`;

    if (previousSummary) {
      prompt = `You are a memory condensation AI.
Merge this new conversation history with the existing summary. 
Keep it concise but retain ALL critical facts, preferences, constraints, and decisions.

Existing Summary:
${previousSummary}

New Conversation History:
${formattedMessages}
`;
    }

    try {
      const { text } = await generateText({
        model: aiModel,
        prompt
      });
      return text;
    } catch (error) {
      console.error("Summarization failed:", error);
      // Fallback: return previous summary if it fails, or a simple concatenation
      return previousSummary || "Failed to generate summary.";
    }
  }
}
