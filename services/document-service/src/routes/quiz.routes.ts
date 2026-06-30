import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';
import { QuizService } from '../services/quiz/quiz.service';
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

const quizService = new QuizService(documentService);
const quizController = new QuizController(quizService);

router.use(authenticate);

// Generate a new quiz
router.post('/generate', quizController.generateQuiz);

// Get all quizzes for user
router.get('/', quizController.getQuizzes);

// Get specific quiz
router.get('/:id', quizController.getQuizById);

// Delete specific quiz
router.delete('/:id', quizController.deleteQuiz);

// Submit an attempt
router.post('/:id/submit', quizController.submitAttempt);

// Get a specific attempt review
router.get('/attempts/:attemptId', quizController.getAttemptById);

export default router;
