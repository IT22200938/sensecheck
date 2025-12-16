import express from 'express';
import {
  logInteraction,
  logInteractionBatch,
  getSessionInteractions,
  getSessionStats,
  getSessionBuckets,
  deleteSessionInteractions,
} from '../controllers/interactionBucketController.js';

const router = express.Router();

/**
 * @route   POST /api/interactions/log
 * @desc    Log a single interaction (global or motor) to bucket
 * @body    { sessionId, interactionType: 'global' | 'motor', ...interactionData }
 */
router.post('/log', logInteraction);

/**
 * @route   POST /api/interactions/batch
 * @desc    Log multiple interactions in batch to bucket
 * @body    { sessionId, interactionType: 'global' | 'motor', interactions: [...] }
 */
router.post('/batch', logInteractionBatch);

/**
 * @route   GET /api/interactions/session/:sessionId
 * @desc    Get all interactions for a session
 * @query   type='global' | 'motor' (optional)
 */
router.get('/session/:sessionId', getSessionInteractions);

/**
 * @route   GET /api/interactions/session/:sessionId/stats
 * @desc    Get interaction statistics for a session
 */
router.get('/session/:sessionId/stats', getSessionStats);

/**
 * @route   GET /api/interactions/session/:sessionId/buckets
 * @desc    Get bucket information for a session
 * @query   type='global' | 'motor' (optional)
 */
router.get('/session/:sessionId/buckets', getSessionBuckets);

/**
 * @route   DELETE /api/interactions/session/:sessionId
 * @desc    Delete all interactions for a session (testing only)
 */
router.delete('/session/:sessionId', deleteSessionInteractions);

export default router;

