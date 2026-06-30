import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics/analytics.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getDashboardData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const data = await this.analyticsService.getDashboardData(userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
