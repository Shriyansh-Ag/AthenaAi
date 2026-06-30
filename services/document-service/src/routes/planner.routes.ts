import { Router } from 'express';
import { PlannerController } from '../controllers/planner.controller';
import { PlannerService } from '../services/planner/planner.service';
import { authenticate } from '../middleware/authenticate';
import { DocumentService } from '../services/document.service';
import { DocumentRepository } from '../repositories/document.repository';
import { createStorageProvider } from '../storage/storage-factory';
import { NoOpVirusScanner } from '../validators/virus-scan.interface';

const router: Router = Router();

// ── Dependency Injection ──────────────────────
const documentRepository = new DocumentRepository();
const storageProvider = createStorageProvider();
const virusScanner = new NoOpVirusScanner();
const maxFileSizeBytes = parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10);

const documentService = new DocumentService(
  documentRepository,
  storageProvider,
  virusScanner,
  maxFileSizeBytes
);

const plannerService = new PlannerService(documentService);
const plannerController = new PlannerController(plannerService);

router.use(authenticate);

// Generate a new study plan
router.post('/generate', plannerController.generatePlan);

// Get active study plan
router.get('/', plannerController.getActivePlan);

// Mark task as complete/missed
router.patch('/:planId/tasks/:taskId', plannerController.updateTaskStatus);

export default router;
