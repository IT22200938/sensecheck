import InteractionBucket from '../models/InteractionBucket.js';
import { logger } from '../services/logging/logger.js';

/**
 * Log a single interaction to bucket
 */
export const logInteraction = async (req, res) => {
  try {
    const { sessionId, interactionType, ...interactionData } = req.body;

    if (!sessionId || !interactionType) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and interaction type are required',
      });
    }

    if (!['global', 'motor'].includes(interactionType)) {
      return res.status(400).json({
        success: false,
        error: 'Interaction type must be "global" or "motor"',
      });
    }

    // Add interaction to appropriate bucket
    const bucket = await InteractionBucket.addInteraction(
      sessionId,
      interactionType,
      interactionData
    );

    logger.info('Interaction logged to bucket', {
      sessionId,
      interactionType,
      bucketNumber: bucket.bucketNumber,
      bucketCount: bucket.count,
      isFull: bucket.isFull,
    });

    res.json({
      success: true,
      data: {
        bucketNumber: bucket.bucketNumber,
        count: bucket.count,
      },
    });
  } catch (error) {
    logger.error('Error logging interaction to bucket:', error);
    
    // Handle session validation error specifically
    if (error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Log multiple interactions in batch to bucket
 */
export const logInteractionBatch = async (req, res) => {
  try {
    const { sessionId, interactionType, interactions } = req.body;

    if (!sessionId || !interactionType || !Array.isArray(interactions)) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, interaction type, and interactions array are required',
      });
    }

    if (!['global', 'motor'].includes(interactionType)) {
      return res.status(400).json({
        success: false,
        error: 'Interaction type must be "global" or "motor"',
      });
    }

    if (interactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Interactions array cannot be empty',
      });
    }

    // Add all interactions to buckets
    await InteractionBucket.addInteractions(
      sessionId,
      interactionType,
      interactions
    );

    logger.info('Batch interactions logged to buckets', {
      sessionId,
      interactionType,
      count: interactions.length,
    });

    res.json({
      success: true,
      data: {
        count: interactions.length,
      },
    });
  } catch (error) {
    logger.error('Error logging batch interactions to buckets:', error);
    
    // Handle session validation error specifically
    if (error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all interactions for a session
 */
export const getSessionInteractions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type } = req.query; // Optional: 'global' or 'motor'

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const interactions = await InteractionBucket.getSessionInteractions(
      sessionId,
      type
    );

    res.json({
      success: true,
      data: {
        sessionId,
        interactionType: type || 'all',
        count: interactions.length,
        interactions,
      },
    });
  } catch (error) {
    logger.error('Error retrieving session interactions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get session interaction statistics
 */
export const getSessionStats = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const stats = await InteractionBucket.getSessionStats(sessionId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error retrieving session stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get bucket details for a session
 */
export const getSessionBuckets = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type } = req.query; // Optional: 'global' or 'motor'

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const query = { sessionId };
    if (type && ['global', 'motor'].includes(type)) {
      query.interactionType = type;
    }

    const buckets = await InteractionBucket.find(query)
      .sort({ bucketNumber: 1 })
      .select('-interactions'); // Exclude interactions array for performance

    res.json({
      success: true,
      data: {
        sessionId,
        interactionType: type || 'all',
        bucketCount: buckets.length,
        buckets,
      },
    });
  } catch (error) {
    logger.error('Error retrieving session buckets:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete all interactions for a session (useful for testing)
 */
export const deleteSessionInteractions = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const result = await InteractionBucket.deleteMany({ sessionId });

    logger.info('Session interactions deleted', {
      sessionId,
      deletedCount: result.deletedCount,
    });

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    logger.error('Error deleting session interactions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

