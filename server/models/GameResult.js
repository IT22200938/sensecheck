const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  colorVisionScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  acuityScore: {
    type: String,
    required: true,
    default: "20/20"
  },
  motorScore: {
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    reactionTrend: [{
      type: Number,
      min: 0
    }]
  },
  literacyScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  overallAssessment: {
    type: String,
    required: true,
    enum: ['Excellent', 'Good', 'Fair', 'Needs Attention', 'Requires Training']
  },
  gameData: {
    signalRecognition: {
      colorBlindnessResults: [mongoose.Schema.Types.Mixed],
      acuityResults: [mongoose.Schema.Types.Mixed]
    },
    bubbleGame: {
      rounds: [mongoose.Schema.Types.Mixed],
      totalBubbles: Number,
      poppedBubbles: Number
    },
    literacyQuiz: {
      answers: [mongoose.Schema.Types.Mixed],
      totalQuestions: Number,
      correctAnswers: Number,
      timeSpent: Number
    }
  }
}, {
  timestamps: true
});

const GameResult = mongoose.model('GameResult', gameResultSchema);

module.exports = GameResult;
