import { StudyPlanModel, IStudyPlan } from '../../models/study-plan.model';
import { PlannerGenerator } from './planner.generator';
import { DocumentService } from '../document.service';

export class PlannerService {
  private plannerGenerator: PlannerGenerator;

  constructor(documentService: DocumentService) {
    this.plannerGenerator = new PlannerGenerator(documentService);
  }

  async generateAndSavePlan(
    userId: string,
    examDate: string,
    availableHoursPerWeek: number,
    weakTopics: string[],
    courseMaterialId?: string
  ): Promise<IStudyPlan> {
    const generated = await this.plannerGenerator.generateStudyPlan(
      userId,
      examDate,
      availableHoursPerWeek,
      weakTopics,
      courseMaterialId
    );

    const newPlan = new StudyPlanModel({
      userId,
      examDate,
      availableHoursPerWeek,
      weakTopics,
      courseMaterialId,
      milestones: generated.milestones,
      dailyTasks: generated.dailyTasks.map(t => ({ ...t, status: 'pending' })),
      progressPercentage: 0
    });

    await newPlan.save();
    return newPlan;
  }

  async getActivePlan(userId: string): Promise<IStudyPlan | null> {
    // Assuming the user has one active plan at a time for simplicity
    return StudyPlanModel.findOne({ userId }).sort({ createdAt: -1 });
  }

  async updateTaskStatus(userId: string, planId: string, taskId: string, status: 'pending' | 'completed' | 'missed'): Promise<IStudyPlan> {
    const plan = await StudyPlanModel.findOne({ _id: planId, userId });
    if (!plan) {
      throw new Error('Study plan not found');
    }

    const taskIndex = plan.dailyTasks.findIndex((t: any) => t._id?.toString() === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    plan.dailyTasks[taskIndex].status = status;

    // Recalculate progress
    const completedTasks = plan.dailyTasks.filter((t: any) => t.status === 'completed').length;
    const totalTasks = plan.dailyTasks.length;
    plan.progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Optional: update milestone completion based on tasks or dates
    const today = new Date().toISOString().split('T')[0];
    plan.milestones.forEach((m: any) => {
      if (m.targetDate <= today) {
        // If it's past the target date, check if tasks up to that date are completed
        const tasksUpToMilestone = plan.dailyTasks.filter((t: any) => t.date <= m.targetDate);
        const allCompleted = tasksUpToMilestone.every((t: any) => t.status === 'completed');
        m.completed = allCompleted;
      }
    });

    await plan.save();
    return plan;
  }

  async deletePlan(userId: string, planId: string): Promise<void> {
    await StudyPlanModel.findOneAndDelete({ _id: planId, userId });
  }
}
