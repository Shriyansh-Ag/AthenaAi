import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus = 'pending' | 'completed' | 'missed';

export interface IStudyTask {
  _id?: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  topic: string;
  description: string;
  estimatedMinutes: number;
  status: TaskStatus;
}

export interface IMilestone {
  _id?: string;
  name: string;
  targetDate: string; // ISO Date string
  completed: boolean;
}

export interface IStudyPlan extends Document {
  userId: string;
  examDate: string;
  availableHoursPerWeek: number;
  weakTopics: string[];
  courseMaterialId?: string;
  milestones: IMilestone[];
  dailyTasks: IStudyTask[];
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudyTaskSchema = new Schema<IStudyTask>({
  date: { type: String, required: true },
  topic: { type: String, required: true },
  description: { type: String, required: true },
  estimatedMinutes: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'missed'], default: 'pending' },
});

const MilestoneSchema = new Schema<IMilestone>({
  name: { type: String, required: true },
  targetDate: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const StudyPlanSchema = new Schema<IStudyPlan>({
  userId: { type: String, required: true, index: true },
  examDate: { type: String, required: true },
  availableHoursPerWeek: { type: Number, required: true },
  weakTopics: [{ type: String }],
  courseMaterialId: { type: String },
  milestones: [MilestoneSchema],
  dailyTasks: [StudyTaskSchema],
  progressPercentage: { type: Number, default: 0 },
}, { timestamps: true });

export const StudyPlanModel = mongoose.models.StudyPlan || mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);
