import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { DocumentService } from '../document.service';

const questionSchema = z.object({
  type: z.enum(['mcq', 'short_answer', 'coding']).describe('The type of question.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level.'),
  bloomLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']).describe('The Bloom Taxonomy level.'),
  questionText: z.string().describe('The actual question text. You may use markdown.'),
  options: z.array(z.string()).optional().describe('4 possible options if the type is mcq. Omit if not mcq.'),
  correctAnswer: z.string().describe('The exact correct answer or a detailed rubric/criteria for short_answer/coding.'),
  explanation: z.string().describe('A detailed explanation of why the answer is correct.'),
  hint: z.string().optional().describe('An optional hint to help the student.'),
});

const quizOutputSchema = z.object({
  title: z.string().describe('A catchy title for the quiz based on the material.'),
  questions: z.array(questionSchema).describe('The list of generated questions.')
});

export class QuizGenerator {
  constructor(private documentService: DocumentService) {}

  /**
   * Generates a quiz based on document context or user queries.
   */
  async generateQuiz(
    userId: string,
    topicOrDocumentId: string,
    count: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    filters?: { course?: string; tags?: string[] }
  ) {
    // 1. Fetch Context
    // We treat topicOrDocumentId as the search query to fetch relevant chunks
    const results = await this.documentService.search(userId, topicOrDocumentId, 'hybrid', filters, 1, 10);
    
    if (!results || results.length === 0) {
      throw new Error('No relevant context found in documents to generate a quiz.');
    }

    const contextText = results.map(r => r.content).join('\n\n');

    // 2. Setup LLM with Structured Output
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.2,
    }).withStructuredOutput(quizOutputSchema);

    // 3. Prompt Template
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are AthenaAI, an expert educator.
      Create a highly engaging, pedagogical quiz based ONLY on the following source material.
      
      Topic/Focus: {topic}
      Number of Questions: {count}
      Target Difficulty: {difficulty}

      Requirements:
      - Include a mix of MCQ and Short Answer (and Coding if the material is programming-related).
      - Ensure questions test different Bloom's Taxonomy levels (e.g., remember, apply, analyze).
      - Provide a clear, detailed explanation for every question.
      - Do NOT use outside knowledge not present in the text unless it's basic common sense.
      
      Source Material:
      {context}
    `);

    const chain = promptTemplate.pipe(model);

    // 4. Generate
    const response = await chain.invoke({
      topic: topicOrDocumentId,
      count: count.toString(),
      difficulty,
      context: contextText
    });

    return response;
  }
}
