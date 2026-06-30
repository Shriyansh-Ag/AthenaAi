import mongoose, { Schema, Document } from 'mongoose';

export type QuestionType = 'mcq' | 'short_answer' | 'coding';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface IQuestion {
  _id?: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  bloomLevel: BloomLevel;
  questionText: string;
  options?: string[]; // for MCQ
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface IQuiz extends Document {
  userId: string;
  title: string;
  documentId?: string;
  tags?: string[];
  difficulty: DifficultyLevel;
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  type: { type: String, enum: ['mcq', 'short_answer', 'coding'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  bloomLevel: { type: String, enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'], required: true },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true },
  hint: { type: String }
});

const QuizSchema = new Schema<IQuiz>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  documentId: { type: String, index: true },
  tags: [{ type: String }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  questions: [QuestionSchema],
}, { timestamps: true });

export const QuizModel = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);

export interface IQuizAttempt extends Document {
  userId: string;
  quizId: string;
  answers: {
    questionId: string;
    answer: string;
    isCorrect?: boolean;
    score?: number;
  }[];
  totalScore: number;
  maxScore: number;
  durationMs: number;
  startedAt: Date;
  completedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>({
  userId: { type: String, required: true, index: true },
  quizId: { type: String, required: true, index: true },
  answers: [{
    questionId: { type: String, required: true },
    answer: { type: String, required: true },
    isCorrect: { type: Boolean },
    score: { type: Number, default: 0 }
  }],
  totalScore: { type: Number, required: true, default: 0 },
  maxScore: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

export const QuizAttemptModel = mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
