import { Request, Response, NextFunction } from 'express';
import { PlannerService } from '../services/planner/planner.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class PlannerController {
  constructor(private plannerService: PlannerService) {}

  generatePlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { examDate, availableHoursPerWeek, weakTopics, courseMaterialId } = req.body;

      if (!examDate || !availableHoursPerWeek) {
        res.status(400).json({ success: false, error: 'examDate and availableHoursPerWeek are required' });
        return;
      }

      // If the user already has an active plan, we could either overwrite it or keep history.
      // We will overwrite their existing one by deleting it first to keep it simple
      const existingPlan = await this.plannerService.getActivePlan(userId);
      if (existingPlan && existingPlan._id) {
        await this.plannerService.deletePlan(userId, existingPlan._id.toString());
      }

      const plan = await this.plannerService.generateAndSavePlan(
        userId,
        examDate,
        availableHoursPerWeek,
        weakTopics || [],
        courseMaterialId
      );

      res.status(201).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  };

  getActivePlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const plan = await this.plannerService.getActivePlan(userId);

      if (!plan) {
        res.status(404).json({ success: false, error: 'No active study plan found' });
        return;
      }

      res.status(200).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  };

  updateTaskStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const planId = req.params.planId as string;
      const taskId = req.params.taskId as string;
      const { status } = req.body;

      if (!['pending', 'completed', 'missed'].includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status' });
        return;
      }

      const updatedPlan = await this.plannerService.updateTaskStatus(userId, planId, taskId, status as any);
      res.status(200).json({ success: true, data: updatedPlan });
    } catch (error) {
      next(error);
    }
  };
}
