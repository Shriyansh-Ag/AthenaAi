import { Request, Response, NextFunction } from 'express';
import { QuizService } from '../services/quiz/quiz.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class QuizController {
  constructor(private quizService: QuizService) {}

  generateQuiz = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { topicOrDocumentId, count, difficulty, filters } = req.body;

      if (!topicOrDocumentId) {
        res.status(400).json({ success: false, error: 'topicOrDocumentId is required' });
        return;
      }

      const quiz = await this.quizService.generateAndSaveQuiz(
        userId,
        topicOrDocumentId,
        count || 5,
        difficulty || 'medium',
        filters
      );

      res.status(201).json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  };

  getQuizzes = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const quizzes = await this.quizService.getQuizzesByUser(userId);
      res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
      next(error);
    }
  };

  getQuizById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const quizId = req.params.id as string;
      // In a real app, you might restrict answers until after they submit, but for simplicity we fetch without answers initially.
      const quiz = await this.quizService.getQuizById(quizId, userId, false);

      if (!quiz) {
        res.status(404).json({ success: false, error: 'Quiz not found' });
        return;
      }

      res.status(200).json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  };

  deleteQuiz = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const quizId = req.params.id as string;
      
      await this.quizService.deleteQuiz(quizId, userId);
      res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  submitAttempt = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const quizId = req.params.id as string;
      const { answers, durationMs } = req.body;

      const attempt = await this.quizService.submitAttempt(userId, quizId, answers, durationMs);
      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  };

  getAttemptById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const attemptId = req.params.attemptId as string;

      const attempt = await this.quizService.getAttemptById(attemptId, userId);
      if (!attempt) {
        res.status(404).json({ success: false, error: 'Attempt not found' });
        return;
      }

      // We should also return the full quiz with answers so the frontend can display correct vs wrong
      const quiz = await this.quizService.getQuizById(attempt.quizId, userId, true);

      res.status(200).json({ success: true, data: { attempt, quiz } });
    } catch (error) {
      next(error);
    }
  };
}
