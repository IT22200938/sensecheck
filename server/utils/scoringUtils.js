/**
 * Scoring utilities for SenseCheck game assessments
 */

/**
 * Calculate color vision score and detect color blindness based on Ishihara plates
 * @param {Array} results - Array of Ishihara plate test responses
 * @returns {Object} Color vision analysis with score and color blindness detection
 */
function calculateColorVisionScore(results) {
  if (!results || results.length === 0) {
    return {
      score: 0,
      isColorBlind: false,
      confidence: 'low',
      details: 'No test data available'
    };
  }
  
  // Analyze each plate response
  let correctResponses = 0;
  let colorBlindIndicators = 0;
  let normalVisionIndicators = 0;
  
  const plateAnalysis = results.map(result => {
    const { plateNumber, userAnswer, normalVision, colorBlindVision, type } = result;
    
    let interpretation = 'unknown';
    let indicatesColorBlind = false;
    let indicatesNormal = false;
    
    // Analyze based on plate type and user response
    if (type === 'control') {
      // Control plates - both normal and color blind should see the same thing
      if (userAnswer === normalVision) {
        correctResponses++;
        interpretation = 'normal_response';
      } else {
        interpretation = 'incorrect_response';
      }
    } else if (type === 'red_green_test') {
      if (plateNumber === 11) {
        // Plate 11: Normal sees 6, color blind sees nothing
        if (userAnswer === 6) {
          correctResponses++;
          normalVisionIndicators++;
          interpretation = 'normal_vision_response';
          indicatesNormal = true;
        } else if (userAnswer === null || userAnswer === 'nothing') {
          correctResponses++;
          colorBlindIndicators++;
          interpretation = 'color_blind_response';
          indicatesColorBlind = true;
        } else {
          // Wrong answer but consider it correct for color blind if it's not 6
          if (userAnswer !== 6) {
            colorBlindIndicators++;
            interpretation = 'likely_color_blind_response';
            indicatesColorBlind = true;
          }
        }
      } else if (plateNumber === 19) {
        // Plate 19: Normal sees nothing, color blind sees 2
        if (userAnswer === null || userAnswer === 'nothing') {
          correctResponses++;
          normalVisionIndicators++;
          interpretation = 'normal_vision_response';
          indicatesNormal = true;
        } else if (userAnswer === 2) {
          correctResponses++;
          colorBlindIndicators++;
          interpretation = 'color_blind_response';
          indicatesColorBlind = true;
        } else {
          // Wrong answer but if they see a number when normal sees nothing, likely color blind
          if (userAnswer !== null && userAnswer !== 'nothing') {
            colorBlindIndicators++;
            interpretation = 'likely_color_blind_response';
            indicatesColorBlind = true;
          }
        }
      } else {
        // Other test plates (like plate 3: normal sees 6, color blind sees 5)
        if (userAnswer === normalVision) {
          correctResponses++;
          normalVisionIndicators++;
          interpretation = 'normal_vision_response';
          indicatesNormal = true;
        } else if (userAnswer === colorBlindVision) {
          correctResponses++;
          colorBlindIndicators++;
          interpretation = 'color_blind_response';
          indicatesColorBlind = true;
        } else {
          interpretation = 'incorrect_response';
        }
      }
    }
    
    return {
      plateNumber,
      userAnswer,
      interpretation,
      indicatesColorBlind,
      indicatesNormal
    };
  });
  
  // Determine color blindness
  const totalTestPlates = results.filter(r => r.type === 'red_green_test').length;
  const colorBlindScore = colorBlindIndicators;
  const normalVisionScore = normalVisionIndicators;
  
  // Color blindness determination logic
  let isColorBlind = false;
  let confidence = 'low';
  
  if (totalTestPlates >= 2) {
    if (colorBlindIndicators > normalVisionIndicators) {
      isColorBlind = true;
      confidence = colorBlindIndicators >= 2 ? 'high' : 'medium';
    } else if (normalVisionIndicators > colorBlindIndicators) {
      isColorBlind = false;
      confidence = normalVisionIndicators >= 2 ? 'high' : 'medium';
    } else {
      // Equal indicators or unclear
      isColorBlind = false;
      confidence = 'low';
    }
  }
  
  // Calculate overall score (0-100)
  const accuracyScore = Math.round((correctResponses / results.length) * 100);
  
  return {
    score: accuracyScore,
    isColorBlind,
    confidence,
    colorBlindIndicators,
    normalVisionIndicators,
    plateAnalysis,
    details: `${correctResponses}/${results.length} plates correctly identified. ${
      isColorBlind ? 
      `Red-green color deficiency detected (confidence: ${confidence})` : 
      `Normal color vision (confidence: ${confidence})`
    }`
  };
}

/**
 * Calculate visual acuity score and convert to Snellen ratio
 * @param {number} smallestCorrectSize - Smallest correctly identified number size
 * @returns {string} Snellen ratio (e.g., "20/20", "20/40")
 */
function calculateAcuityScore(smallestCorrectSize) {
  // Map our font sizes to Snellen ratios
  // Our sizes: 40, 32, 24, 16, 12, 8, 6, 4, 3, 2
  // Corresponding to: 20/200, 20/160, 20/120, 20/80, 20/60, 20/40, 20/30, 20/20, 20/15, 20/10
  
  const sizeToSnellen = {
    40: '20/200',  // Largest size = worst acuity
    32: '20/160',
    24: '20/120', 
    16: '20/80',
    12: '20/60',
    8: '20/40',
    6: '20/30',
    4: '20/20',   // Normal vision
    3: '20/15',   // Better than normal
    2: '20/10'    // Smallest size = best acuity
  };
  
  return sizeToSnellen[smallestCorrectSize] || '20/200';
}

/**
 * Calculate motor skills score from bubble game performance
 * @param {Object} gameData - Bubble game data
 * @returns {Object} Motor score with accuracy and trend analysis
 */
function calculateMotorScore(gameData) {
  const { totalBubbles, poppedBubbles, rounds } = gameData;
  
  if (!totalBubbles || totalBubbles === 0) {
    return { accuracy: 0, reactionTrend: [] };
  }
  
  const accuracy = Math.round((poppedBubbles / totalBubbles) * 100);
  
  // Calculate reaction trend from rounds
  const reactionTrend = rounds.map(round => round.averageReactionTime || 0);
  
  return {
    accuracy,
    reactionTrend
  };
}

/**
 * Calculate computer literacy score
 * @param {Object} quizData - Quiz results data
 * @returns {number} Score from 0-100
 */
function calculateLiteracyScore(quizData) {
  // Handle both direct values and nested structure
  let correctAnswers, totalQuestions, timeSpent;
  
  if (typeof quizData.correctAnswers !== 'undefined') {
    // Direct structure
    correctAnswers = quizData.correctAnswers;
    totalQuestions = quizData.totalQuestions;
    timeSpent = quizData.timeSpent;
  } else if (quizData.answers && Array.isArray(quizData.answers)) {
    // Calculate from answers array
    correctAnswers = quizData.answers.filter(answer => answer.isCorrect).length;
    totalQuestions = quizData.answers.length;
    timeSpent = quizData.answers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0);
  } else {
    return 0;
  }
  
  if (!totalQuestions || totalQuestions === 0) return 0;
  
  const baseScore = (correctAnswers / totalQuestions) * 100;
  
  // Speed bonus: faster completion gets slight bonus
  const averageTimePerQuestion = timeSpent / totalQuestions;
  const speedWeight = averageTimePerQuestion < 5000 ? 1.1 : averageTimePerQuestion > 10000 ? 0.9 : 1.0;
  
  return Math.min(100, Math.round(baseScore * speedWeight));
}

/**
 * Calculate overall assessment based on all scores
 * @param {Object} scores - All individual scores
 * @returns {string} Overall assessment
 */
function calculateOverallAssessment(scores) {
  const { colorVisionScore, motorScore, literacyScore } = scores;
  
  // Convert acuity score to numeric for calculation (0-100 scale)
  const acuityToNumeric = {
    '20/10': 100,   // Perfect vision
    '20/15': 95,    // Better than normal
    '20/20': 90,    // Normal vision
    '20/30': 75,    // Good vision
    '20/40': 60,    // Acceptable vision
    '20/60': 45,    // Moderate impairment
    '20/80': 35,    // Significant impairment
    '20/120': 25,   // Poor vision
    '20/160': 15,   // Very poor vision
    '20/200': 5     // Legal blindness threshold
  };
  
  const acuityNumeric = acuityToNumeric[scores.acuityScore] || 5;
  
  const averageScore = (colorVisionScore + acuityNumeric + motorScore.accuracy + literacyScore) / 4;
  
  if (averageScore >= 90) return 'Excellent';
  if (averageScore >= 75) return 'Good';
  if (averageScore >= 60) return 'Fair';
  if (averageScore >= 40) return 'Needs Attention';
  return 'Requires Training';
}

/**
 * Process all game results and calculate final scores
 * @param {Object} gameData - Complete game session data
 * @returns {Object} Processed scores and assessment
 */
function processGameResults(gameData) {
  const colorVisionAnalysis = calculateColorVisionScore(gameData.signalRecognition?.colorBlindnessResults || []);
  const acuityScore = calculateAcuityScore(gameData.signalRecognition?.smallestCorrectSize || 10);
  const motorScore = calculateMotorScore(gameData.bubbleGame || {});
  const literacyScore = calculateLiteracyScore(gameData.literacyQuiz || {});
  
  const scores = {
    colorVisionScore: colorVisionAnalysis.score,
    colorVisionAnalysis, // Include full analysis
    acuityScore,
    motorScore,
    literacyScore
  };
  
  const overallAssessment = calculateOverallAssessment(scores);
  
  return {
    ...scores,
    overallAssessment
  };
}

module.exports = {
  calculateColorVisionScore,
  calculateAcuityScore,
  calculateMotorScore,
  calculateLiteracyScore,
  calculateOverallAssessment,
  processGameResults
};
