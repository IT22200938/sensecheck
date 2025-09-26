const express = require('express');
const router = express.Router();
const {
  createUser,
  saveGameResults,
  getUserResults,
  getGameResult
} = require('../controllers/gameController');

// User routes
router.post('/users', createUser);

// Game result routes
router.post('/results', saveGameResults);
router.get('/users/:userId/results', getUserResults);
router.get('/results/:resultId', getGameResult);

module.exports = router;
