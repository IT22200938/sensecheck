import MotorSkillsInteraction from '../models/MotorSkillsInteraction.js';
import { logger } from '../services/logging/logger.js';

// Batch store for async batching
let motorSkillsBatch = [];
const BATCH_SIZE = 10; // Smaller batch for faster persistence
const BATCH_TIMEOUT = 2000; // 2 seconds

let batchTimer = null;

const flushBatch = async () => {
  if (motorSkillsBatch.length === 0) return;
  
  const batch = [...motorSkillsBatch];
  motorSkillsBatch = [];
  
  try {
    await MotorSkillsInteraction.insertMany(batch);
    logger.info(`✅ Flushed ${batch.length} motor skills interactions to MongoDB`);
  } catch (error) {
    logger.error('❌ Error flushing motor skills batch:', error);
    // Re-add to batch for retry
    motorSkillsBatch = [...batch, ...motorSkillsBatch];
  }
};

// Periodic flush every 10 seconds to ensure data persistence
setInterval(async () => {
  if (motorSkillsBatch.length > 0) {
    await flushBatch();
  }
}, 10000);

// Flush batch on process exit to avoid data loss
process.on('SIGINT', async () => {
  console.log('\n🔄 Flushing remaining motor skills interactions before shutdown...');
  await flushBatch();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Flushing remaining motor skills interactions before shutdown...');
  await flushBatch();
  process.exit(0);
});

// Log single motor skills interaction
export const logMotorSkillsInteraction = async (req, res) => {
  try {
    const interactionData = {
      ...req.body,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
    };

    // Add to batch
    motorSkillsBatch.push(interactionData);
    
    // Flush if batch is full
    if (motorSkillsBatch.length >= BATCH_SIZE) {
      await flushBatch();
      
      // Clear existing timer
      if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
      }
    } else {
      // Set timer for batch flush if not already set
      if (!batchTimer) {
        batchTimer = setTimeout(() => {
          flushBatch();
          batchTimer = null;
        }, BATCH_TIMEOUT);
      }
    }

    res.status(201).json({ 
      success: true, 
      message: 'Motor skills interaction logged',
      batchSize: motorSkillsBatch.length 
    });
  } catch (error) {
    logger.error('Error logging motor skills interaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log motor skills interaction' 
    });
  }
};

// Log multiple motor skills interactions (batch)
export const logMotorSkillsBatch = async (req, res) => {
  try {
    const { interactions } = req.body;
    
    if (!Array.isArray(interactions)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Interactions must be an array' 
      });
    }

    const processedInteractions = interactions.map(interaction => ({
      ...interaction,
      timestamp: interaction.timestamp ? new Date(interaction.timestamp) : new Date(),
    }));

    // Save to database
    await MotorSkillsInteraction.insertMany(processedInteractions);
    logger.info(`✅ ${processedInteractions.length} motor skills interactions saved`, {
      sessionId: processedInteractions[0]?.sessionId,
      round: processedInteractions[0]?.round,
    });

    res.status(201).json({ 
      success: true, 
      message: `${processedInteractions.length} motor skills interactions logged` 
    });
  } catch (error) {
    logger.error('Error logging motor skills batch:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log motor skills interactions' 
    });
  }
};

// Get motor skills interactions for a session
export const getSessionMotorSkills = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { round, eventType, startTime, endTime } = req.query;

    const query = { sessionId };
    
    if (round) {
      query.round = parseInt(round);
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    const interactions = await MotorSkillsInteraction.find(query).sort({ timestamp: 1 });

    res.json({ 
      success: true, 
      count: interactions.length,
      interactions 
    });
  } catch (error) {
    logger.error('Error fetching motor skills interactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch motor skills interactions' 
    });
  }
};

// Get motor skills analytics for a session
export const getMotorSkillsAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Aggregate statistics
    const stats = await MotorSkillsInteraction.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: '$round',
          totalInteractions: { $sum: 1 },
          bubbleHits: {
            $sum: { $cond: [{ $eq: ['$eventType', 'bubble_hit'] }, 1, 0] }
          },
          bubbleMisses: {
            $sum: { $cond: [{ $eq: ['$eventType', 'bubble_miss'] }, 1, 0] }
          },
          stageMisses: {
            $sum: { $cond: [{ $eq: ['$eventType', 'stage_clicked_miss'] }, 1, 0] }
          },
          avgReactionTime: { $avg: '$reactionTime' },
          avgVelocity: { $avg: '$velocity.magnitude' },
          avgAccuracy: { $avg: '$clickAccuracy.distanceFromCenter' },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ 
      success: true,
      sessionId,
      roundStats: stats
    });
  } catch (error) {
    logger.error('Error fetching motor skills analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch motor skills analytics' 
    });
  }
};

