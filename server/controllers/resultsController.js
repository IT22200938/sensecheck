import VisionResult from '../models/VisionResult.js';
import LiteracyResult from '../models/LiteracyResult.js';
import Session from '../models/Session.js';
import { logger } from '../services/logging/logger.js';

// Save vision test results
export const saveVisionResults = async (req, res) => {
  try {
    const { sessionId, colorBlindness, visualAcuity, testConditions } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID is required' 
      });
    }

    // Check if results already exist
    let visionResult = await VisionResult.findOne({ sessionId });
    
    if (visionResult) {
      // Update existing results
      if (colorBlindness) visionResult.colorBlindness = colorBlindness;
      if (visualAcuity) visionResult.visualAcuity = visualAcuity;
      if (testConditions) visionResult.testConditions = testConditions;
      visionResult.completedAt = new Date();
      
      await visionResult.save();
    } else {
      // Create new results
      visionResult = new VisionResult({
        sessionId,
        colorBlindness,
        visualAcuity,
        testConditions,
      });
      
      await visionResult.save();
    }

    // Update session
    await Session.findOneAndUpdate(
      { sessionId },
      { 
        $addToSet: { 
          completedModules: { 
            moduleName: 'vision', 
            completedAt: new Date() 
          } 
        } 
      },
      { upsert: true }
    );

    logger.info(`Vision results saved for session ${sessionId}`);

    res.status(201).json({ 
      success: true, 
      message: 'Vision results saved',
      data: visionResult 
    });
  } catch (error) {
    logger.error('Error saving vision results:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save vision results' 
    });
  }
};

// Save literacy test results
export const saveLiteracyResults = async (req, res) => {
  try {
    const { 
      sessionId, 
      responses, 
      score, 
      metrics, 
      categoryScores 
    } = req.body;

    // Validate required fields
    if (!sessionId || !responses) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID and responses are required' 
      });
    }

    // Create new results
    const literacyResult = new LiteracyResult({
      sessionId,
      responses,
      score,
      metrics,
      categoryScores,
    });
    
    await literacyResult.save();

    // Update session
    await Session.findOneAndUpdate(
      { sessionId },
      { 
        $addToSet: { 
          completedModules: { 
            moduleName: 'literacy', 
            completedAt: new Date() 
          } 
        } 
      },
      { upsert: true }
    );

    logger.info(`Literacy results saved for session ${sessionId}`);

    res.status(201).json({ 
      success: true, 
      message: 'Literacy results saved',
      data: literacyResult 
    });
  } catch (error) {
    logger.error('Error saving literacy results:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save literacy results' 
    });
  }
};

// Get all results for a session
export const getSessionResults = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [session, visionResult, literacyResult] = await Promise.all([
      Session.findOne({ sessionId }),
      VisionResult.findOne({ sessionId }),
      LiteracyResult.findOne({ sessionId }),
    ]);

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        session,
        visionResult,
        literacyResult,
      }
    });
  } catch (error) {
    logger.error('Error fetching session results:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch results' 
    });
  }
};

// Update module completion
export const updateModuleCompletion = async (req, res) => {
  try {
    const { sessionId, moduleName } = req.body;

    if (!sessionId || !moduleName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID and module name are required' 
      });
    }

    const session = await Session.findOneAndUpdate(
      { sessionId },
      { 
        $addToSet: { 
          completedModules: { 
            moduleName, 
            completedAt: new Date() 
          } 
        } 
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    logger.info(`Module completed: ${moduleName} for session ${sessionId}`);

    res.json({ 
      success: true, 
      data: session 
    });
  } catch (error) {
    logger.error('Error updating module completion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update module completion' 
    });
  }
};

// Update session performance metrics
export const updateSessionPerformance = async (req, res) => {
  try {
    const { sessionId, perf } = req.body;

    if (!sessionId || !perf) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID and performance metrics are required' 
      });
    }

    const session = await Session.findOneAndUpdate(
      { sessionId },
      { 
        perf: {
          samplingHzTarget: perf.samplingHzTarget || 60,
          samplingHzEstimated: perf.samplingHzEstimated,
          avgFrameMs: perf.avgFrameMs,
          p95FrameMs: perf.p95FrameMs,
          droppedFrames: perf.droppedFrames,
          inputLagMsEstimate: perf.inputLagMsEstimate,
        }
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    logger.info(`Performance metrics updated for session ${sessionId}`, perf);

    res.json({ 
      success: true, 
      data: session 
    });
  } catch (error) {
    logger.error('Error updating session performance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update session performance' 
    });
  }
};

// Helper: Compute age bucket from age
function computeAgeBucket(age) {
  if (!age || age < 18) return 'unknown';
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  if (age <= 64) return '55-64';
  return '65+';
}

// Create or update session
export const createSession = async (req, res) => {
  try {
    const { 
      sessionId, 
      userAgent, 
      screenResolution, 
      deviceType,
      preferredTheme,
      viewportWidth,
      viewportHeight,
      highContrastMode,
      reducedMotionPreference,
      devicePixelRatio,
      hardwareConcurrency,
      pageLoadTime,
      connectionType,
      memory,
      platform,
      language,
      // ML-ready normalized fields
      device,
      screen,
      userInfo 
    } = req.body;

    // Validate userInfo
    if (!userInfo || !userInfo.age || !userInfo.gender) {
      return res.status(400).json({ 
        success: false, 
        error: 'User information (age and gender) is required' 
      });
    }

    // Generate participantId (anonymized hash based on session)
    const participantId = `participant_${sessionId.split('_')[1] || Date.now()}`;

    const session = await Session.findOneAndUpdate(
      { sessionId },
      { 
        sessionId,
        participantId,
        // Basic device info (legacy)
        userAgent,
        screenResolution,
        deviceType,
        // Enhanced device metrics (legacy)
        preferredTheme,
        viewportWidth,
        viewportHeight,
        highContrastMode,
        reducedMotionPreference,
        devicePixelRatio,
        hardwareConcurrency,
        pageLoadTime,
        connectionType,
        memory,
        platform,
        language,
        // ML-ready normalized device block
        device: device ? {
          pointerPrimary: device.pointerPrimary || 'unknown',
          os: device.os || 'unknown',
          browser: device.browser || 'unknown',
        } : undefined,
        // ML-ready screen info
        screen: screen ? {
          width: screen.width,
          height: screen.height,
          dpr: screen.dpr || devicePixelRatio || 1,
        } : undefined,
        // User demographic info with ageBucket
        userInfo: {
          age: parseInt(userInfo.age),
          gender: userInfo.gender,
          ageBucket: computeAgeBucket(parseInt(userInfo.age)),
        },
        createdAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    logger.info(`Session created/updated: ${sessionId}`, { 
      participantId,
      age: userInfo.age, 
      ageBucket: computeAgeBucket(parseInt(userInfo.age)),
      gender: userInfo.gender,
      deviceType,
      device: device ? `${device.os} / ${device.browser} / ${device.pointerPrimary}` : 'legacy',
      viewport: `${viewportWidth}x${viewportHeight}`
    });

    res.status(201).json({ 
      success: true, 
      data: session 
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user information provided',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create session' 
    });
  }
};

