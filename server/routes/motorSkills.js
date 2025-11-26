import express from 'express';
import { 
  logMotorSkillsInteraction,
  logMotorSkillsBatch,
  getSessionMotorSkills,
  getMotorSkillsAnalytics
} from '../controllers/motorSkillsController.js';

const router = express.Router();

// POST /api/motor-skills/interaction - Log single motor skills interaction
router.post('/interaction', logMotorSkillsInteraction);

// POST /api/motor-skills/batch - Log multiple motor skills interactions
router.post('/batch', logMotorSkillsBatch);

// GET /api/motor-skills/session/:sessionId - Get motor skills interactions for a session
router.get('/session/:sessionId', getSessionMotorSkills);

// GET /api/motor-skills/analytics/:sessionId - Get motor skills analytics for a session
router.get('/analytics/:sessionId', getMotorSkillsAnalytics);

export default router;

