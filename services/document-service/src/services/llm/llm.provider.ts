import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { LanguageModel } from 'ai';
import { env } from '../../config/env';

export type LLMProviderType = 'openai' | 'anthropic' | 'google' | 'deepseek';

export class LLMProviderFactory {
  static getModel(provider: LLMProviderType, modelId: string): LanguageModel {
    switch (provider) {
      case 'openai': {
        const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY || '' });
        return openai(modelId);
      }
      
      case 'anthropic': {
        const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY || '' });
        return anthropic(modelId);
      }
      
      case 'google': {
        const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_API_KEY || '' });
        return google(modelId);
      }

      case 'deepseek': {
        // DeepSeek is OpenAI compatible, so we can use the openai SDK with a custom base URL
        const deepseek = createOpenAI({ 
          apiKey: env.DEEPSEEK_API_KEY || '', 
          baseURL: 'https://api.deepseek.com/v1' 
        });
        return deepseek(modelId);
      }
      
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}
