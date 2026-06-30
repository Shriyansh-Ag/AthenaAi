import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { ConversationService } from '../services/conversation.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { RAGOrchestrator } from '../services/rag/rag.orchestrator';
import { DocumentService } from '../services/document.service';
import { DocumentRepository } from '../repositories/document.repository';
import { createStorageProvider } from '../storage/storage-factory';
import { NoOpVirusScanner } from '../validators/virus-scan.interface';
import { authenticate } from '../middleware/authenticate';

// ── Dependency Injection ──────────────────────
const documentRepository = new DocumentRepository();
const storageProvider = createStorageProvider();
const virusScanner = new NoOpVirusScanner();

// We need documentService for RAG Orchestrator
const documentService = new DocumentService(
  documentRepository,
  storageProvider,
  virusScanner,
  10 * 1024 * 1024
);

const conversationRepository = new ConversationRepository();
const ragOrchestrator = new RAGOrchestrator(documentService);
const conversationService = new ConversationService(conversationRepository, ragOrchestrator, documentService);
const conversationController = new ConversationController(conversationService);

// ── Route Definitions ────────────────────────────────────────────────────
const router: Router = Router();

// Chat streaming
router.post(
  '/stream',
  authenticate,
  conversationController.streamChat
);

// Get all conversations
router.get(
  '/',
  authenticate,
  conversationController.getConversations
);

// Create new conversation explicitly
router.post(
  '/',
  authenticate,
  conversationController.createConversation
);

// Get messages for conversation
router.get(
  '/:id/messages',
  authenticate,
  conversationController.getMessages
);

// Rename conversation
router.patch(
  '/:id',
  authenticate,
  conversationController.renameConversation
);

// Delete a conversation
router.delete(
  '/:id',
  authenticate,
  conversationController.deleteConversation
);

// Pin a message
router.put(
  '/:id/messages/:msgId/pin',
  authenticate,
  conversationController.pinMessage
);

// Clear memory
router.delete(
  '/:id/memory',
  authenticate,
  conversationController.clearMemory
);

export default router;
