import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { DocumentService } from '../document.service';

const milestoneSchema = z.object({
  name: z.string().describe('The name of the milestone (e.g., "Complete Dynamic Programming").'),
  targetDate: z.string().describe('The target date for this milestone in YYYY-MM-DD format.'),
});

const studyTaskSchema = z.object({
  date: z.string().describe('The date to study this topic in YYYY-MM-DD format.'),
  topic: z.string().describe('The specific topic or concept to study.'),
  description: z.string().describe('A brief description of what to do (e.g., "Read chapter 4 and solve 2 problems").'),
  estimatedMinutes: z.number().describe('Estimated time in minutes needed to complete the task.'),
});

const studyPlanOutputSchema = z.object({
  milestones: z.array(milestoneSchema).describe('Major milestones leading up to the exam.'),
  dailyTasks: z.array(studyTaskSchema).describe('The day-by-day study tasks.')
});

export class PlannerGenerator {
  constructor(private documentService: DocumentService) {}

  /**
   * Generates a personalized study schedule.
   */
  async generateStudyPlan(
    userId: string,
    examDate: string,
    availableHoursPerWeek: number,
    weakTopics: string[],
    courseMaterialId?: string
  ) {
    // 1. Fetch Context
    // We treat weak topics or the first weak topic as the query
    const query = weakTopics.length > 0 ? weakTopics.join(', ') : 'core concepts';
    let contextText = '';
    
    try {
      // If courseMaterialId is provided, we could filter by it, but for simplicity we'll just search using the weak topics
      const filters = courseMaterialId ? { course: courseMaterialId } : undefined;
      const results = await this.documentService.search(userId, query, 'hybrid', filters, 1, 10);
      
      if (results && results.length > 0) {
        contextText = results.map(r => r.content).join('\n\n');
      }
    } catch (error) {
      console.warn('Could not fetch context for study plan generator:', error);
    }

    // 2. Setup LLM with Structured Output
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.2,
    }).withStructuredOutput(studyPlanOutputSchema);

    // 3. Prompt Template
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are AthenaAI, an expert study planner and academic coach.
      Create a highly structured, day-by-day study schedule for a student.
      
      Constraints:
      - Current Date: {currentDate}
      - Exam Date: {examDate}
      - Available Study Time: {availableHoursPerWeek} hours per week.
      - Weak Topics to prioritize: {weakTopics}
      
      Requirements:
      1. Distribute the available hours logically across the days between now and the exam. Do not exceed the available hours per week.
      2. Prioritize the weak topics heavily, allocating more time to them.
      3. Include specific daily tasks (e.g., "Review concept X", "Practice 5 problems on Y").
      4. Define 2-4 major milestones to track progress before the exam.
      5. The final few days before the exam should be reserved for comprehensive revision and mock tests.
      6. Return dates strictly in YYYY-MM-DD format.

      Course Context (Optional context from their uploaded materials):
      {context}
    `);

    const chain = promptTemplate.pipe(model);

    // 4. Generate
    const response = await chain.invoke({
      currentDate: new Date().toISOString().split('T')[0],
      examDate,
      availableHoursPerWeek: availableHoursPerWeek.toString(),
      weakTopics: weakTopics.join(', '),
      context: contextText || 'No specific course material provided. Generate a general plan based on the weak topics.'
    });

    return response;
  }
}
