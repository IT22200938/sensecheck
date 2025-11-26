import InteractionLog from '../models/InteractionLog.js';
import { interactionLogger, logger } from '../services/logging/logger.js';

// Batch store for async batching
let interactionBatch = [];
const BATCH_SIZE = 10; // Reduced from 50 for faster flushing
const BATCH_TIMEOUT = 2000; // Reduced to 2 seconds for faster persistence

let batchTimer = null;

const flushBatch = async () => {
  if (interactionBatch.length === 0) return;
  
  const batch = [...interactionBatch];
  interactionBatch = [];
  
  try {
    await InteractionLog.insertMany(batch);
    interactionLogger.info(`✅ Flushed ${batch.length} interactions to MongoDB`);
  } catch (error) {
    logger.error('❌ Error flushing interaction batch:', error);
    // Re-add to batch for retry
    interactionBatch = [...batch, ...interactionBatch];
  }
};

// Periodic flush every 10 seconds to ensure data persistence
setInterval(async () => {
  if (interactionBatch.length > 0) {
    await flushBatch();
  }
}, 10000);

// Flush batch on process exit to avoid data loss
process.on('SIGINT', async () => {
  console.log('\n🔄 Flushing remaining interactions before shutdown...');
  await flushBatch();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Flushing remaining interactions before shutdown...');
  await flushBatch();
  process.exit(0);
});

// Log single interaction
export const logInteraction = async (req, res) => {
  try {
    const interactionData = {
      ...req.body,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
    };

    // Add to batch
    interactionBatch.push(interactionData);
    
    // Log to file immediately
    interactionLogger.info('Interaction logged', interactionData);
    
    // Flush if batch is full
    if (interactionBatch.length >= BATCH_SIZE) {
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
      message: 'Interaction logged',
      batchSize: interactionBatch.length,
      willFlushIn: batchTimer ? 'soon' : `${BATCH_TIMEOUT}ms`
    });
  } catch (error) {
    logger.error('Error logging interaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log interaction' 
    });
  }
};

// Log multiple interactions (batch)
export const logInteractionBatch = async (req, res) => {
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

    // Log to file
    interactionLogger.info(`Batch of ${processedInteractions.length} interactions`, {
      sessionId: processedInteractions[0]?.sessionId,
      module: processedInteractions[0]?.module,
    });

    // Save to database
    await InteractionLog.insertMany(processedInteractions);

    res.status(201).json({ 
      success: true, 
      message: `${processedInteractions.length} interactions logged` 
    });
  } catch (error) {
    logger.error('Error logging interaction batch:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log interactions' 
    });
  }
};

// Get interactions for a session
export const getSessionInteractions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { module, startTime, endTime } = req.query;

    const query = { sessionId };
    
    if (module) {
      query.module = module;
    }
    
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    const interactions = await InteractionLog.find(query).sort({ timestamp: 1 });

    res.json({ 
      success: true, 
      count: interactions.length,
      interactions 
    });
  } catch (error) {
    logger.error('Error fetching interactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch interactions' 
    });
  }
};

