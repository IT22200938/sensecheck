import express from 'express';
import { 
  logInteraction, 
  logInteractionBatch,
  getSessionInteractions 
} from '../controllers/logController.js';

const router = express.Router();

// POST /api/logs/interaction - Log single interaction
router.post('/interaction', logInteraction);

// POST /api/logs/batch - Log multiple interactions
router.post('/batch', logInteractionBatch);

// GET /api/logs/session/:sessionId - Get interactions for a session
router.get('/session/:sessionId', getSessionInteractions);

export default router;

