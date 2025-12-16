import GlobalInteractionBucket from '../models/GlobalInteractionBucket.js';
import { logger } from '../services/logging/logger.js';

/**
 * Global Interaction Controllers
 */

/**
 * Log global interactions (batch)
 */
export const logGlobalInteractions = async (req, res) => {
  try {
    const { sessionId, interactions } = req.body;

    if (!sessionId || !Array.isArray(interactions) || interactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and interactions array are required',
      });
    }

    const bucket = await GlobalInteractionBucket.addInteractions(sessionId, interactions);

    logger.info('Global interactions logged', {
      sessionId,
      count: interactions.length,
      bucketNumber: bucket.bucketNumber,
    });

    res.json({
      success: true,
      data: {
        bucketNumber: bucket.bucketNumber,
        count: bucket.count,
      },
    });
  } catch (error) {
    logger.error('Error logging global interactions:', error);
    
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
 * Get global interactions for a session
 */
export const getGlobalInteractions = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const interactions = await GlobalInteractionBucket.getSessionInteractions(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        count: interactions.length,
        interactions,
      },
    });
  } catch (error) {
    logger.error('Error retrieving global interactions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


