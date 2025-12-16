import express from 'express';
import {
  logGlobalInteractions,
  getGlobalInteractions,
} from '../controllers/globalInteractionController.js';

const router = express.Router();

/**
 * @route   POST /api/global/interactions
 * @desc    Log global interactions (batch)
 * @body    { sessionId, interactions: [{eventType, timestamp, data: {...}}] }
 */
router.post('/interactions', logGlobalInteractions);

/**
 * @route   GET /api/global/interactions/:sessionId
 * @desc    Get all global interactions for a session
 */
router.get('/interactions/:sessionId', getGlobalInteractions);

export default router;


