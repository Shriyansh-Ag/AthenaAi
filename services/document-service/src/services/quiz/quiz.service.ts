import { QuizModel, QuizAttemptModel, IQuiz, IQuizAttempt } from '../../models/quiz.model';
import { QuizGenerator } from './quiz.generator';

import { DocumentService } from '../document.service';

export class QuizService {
  private quizGenerator: QuizGenerator;

  constructor(documentService: DocumentService) {
    this.quizGenerator = new QuizGenerator(documentService);
  }

  async generateAndSaveQuiz(
    userId: string,
    topicOrDocumentId: string,
    count: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    filters?: { course?: string; tags?: string[] }
  ): Promise<IQuiz> {
    const generated = await this.quizGenerator.generateQuiz(userId, topicOrDocumentId, count, difficulty, filters);

    const newQuiz = new QuizModel({
      userId,
      title: generated.title,
      documentId: topicOrDocumentId, // Optional mapping
      difficulty,
      questions: generated.questions,
    });

    await newQuiz.save();
    return newQuiz;
  }

  async getQuizzesByUser(userId: string): Promise<IQuiz[]> {
    return QuizModel.find({ userId }).sort({ createdAt: -1 }).select('-questions.correctAnswer -questions.explanation');
  }

  async getQuizById(quizId: string, userId: string, withAnswers: boolean = false): Promise<IQuiz | null> {
    const query = QuizModel.findOne({ _id: quizId, userId });
    if (!withAnswers) {
      query.select('-questions.correctAnswer -questions.explanation');
    }
    return query;
  }

  async deleteQuiz(quizId: string, userId: string): Promise<void> {
    await QuizModel.findOneAndDelete({ _id: quizId, userId });
    await QuizAttemptModel.deleteMany({ quizId, userId });
  }

  async submitAttempt(
    userId: string,
    quizId: string,
    answers: { questionId: string; answer: string }[],
    durationMs: number
  ): Promise<IQuizAttempt> {
    const quiz = await QuizModel.findOne({ _id: quizId, userId });
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    let totalScore = 0;
    const maxScore = quiz.questions.length; // Assuming 1 point per question for now

    const gradedAnswers = answers.map((userAnswer) => {
      const question = quiz.questions.find((q: any) => q._id?.toString() === userAnswer.questionId);
      if (!question) {
        return { ...userAnswer, isCorrect: false, score: 0 };
      }

      let isCorrect = false;
      let score = 0;

      // Extremely basic exact-match grading for MCQ
      // For short_answer/coding, we'd ideally use an LLM grader. 
      // For this sprint, we'll do simple string matching or manual review later.
      if (question.type === 'mcq') {
        isCorrect = userAnswer.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        score = isCorrect ? 1 : 0;
      } else {
        // Fallback: mark as 0 or pending manual review
        // In a full implementation, we'd invoke another LLM call to grade the short answer.
        // For now, if they typed anything and it contains keywords, let's just give them 0.5 
        // Or if we want strict correctness, we'll mark false.
        // Let's do a basic includes check as a placeholder.
        isCorrect = userAnswer.answer.toLowerCase().includes(question.correctAnswer.toLowerCase().split(' ')[0] || '');
        score = isCorrect ? 1 : 0;
      }

      totalScore += score;

      return {
        questionId: userAnswer.questionId,
        answer: userAnswer.answer,
        isCorrect,
        score
      };
    });

    const attempt = new QuizAttemptModel({
      userId,
      quizId,
      answers: gradedAnswers,
      totalScore,
      maxScore,
      durationMs,
      startedAt: new Date(Date.now() - durationMs), // Approximate start
      completedAt: new Date()
    });

    await attempt.save();
    return attempt;
  }

  async getAttemptById(attemptId: string, userId: string): Promise<IQuizAttempt | null> {
    return QuizAttemptModel.findOne({ _id: attemptId, userId });
  }
}
