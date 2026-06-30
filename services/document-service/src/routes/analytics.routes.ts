import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsService } from '../services/analytics/analytics.service';
import { authenticate } from '../middleware/authenticate';

const router: Router = Router();

const analyticsService = new AnalyticsService();
const analyticsController = new AnalyticsController(analyticsService);

router.use(authenticate);

// Get learning analytics dashboard data
router.get('/dashboard', analyticsController.getDashboardData);

export default router;
