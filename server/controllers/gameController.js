const User = require('../models/User');
const GameResult = require('../models/GameResult');
const { processGameResults } = require('../utils/scoringUtils');

/**
 * Create a new user
 */
const createUser = async (req, res) => {
  try {
    const { name, age, email } = req.body;
    
    if (!name || !age || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, and email are required'
      });
    }
    
    const user = new User({ name, age, email });
    await user.save();
    
    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

/**
 * Save game results
 */
const saveGameResults = async (req, res) => {
  try {
    const { userId, gameData } = req.body;
    
    if (!userId || !gameData) {
      return res.status(400).json({
        success: false,
        message: 'User ID and game data are required'
      });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Process game results and calculate scores
    const processedResults = processGameResults(gameData);
    
    // Create game result record
    const gameResult = new GameResult({
      userId,
      colorVisionScore: processedResults.colorVisionScore,
      acuityScore: processedResults.acuityScore,
      motorScore: processedResults.motorScore,
      literacyScore: processedResults.literacyScore,
      overallAssessment: processedResults.overallAssessment,
      gameData
    });
    
    await gameResult.save();
    
    res.status(201).json({
      success: true,
      data: {
        resultId: gameResult._id,
        scores: {
          colorVisionScore: processedResults.colorVisionScore,
          acuityScore: processedResults.acuityScore,
          motorScore: processedResults.motorScore,
          literacyScore: processedResults.literacyScore,
          overallAssessment: processedResults.overallAssessment
        }
      }
    });
  } catch (error) {
    console.error('Error saving game results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save game results'
    });
  }
};

/**
 * Get user's game results
 */
const getUserResults = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const results = await GameResult.find({ userId })
      .populate('userId', 'name age email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching user results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user results'
    });
  }
};

/**
 * Get specific game result
 */
const getGameResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    
    const result = await GameResult.findById(resultId)
      .populate('userId', 'name age email');
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Game result not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching game result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game result'
    });
  }
};

module.exports = {
  createUser,
  saveGameResults,
  getUserResults,
  getGameResult
};
