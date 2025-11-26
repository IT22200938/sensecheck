import mongoose from 'mongoose';

const questionResponseSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  question: String,
  userAnswer: {
    type: String,
    required: true,
  },
  correctAnswer: String,
  isCorrect: Boolean,
  responseTime: Number, // milliseconds
  focusShifts: Number,
  hoverEvents: [{
    option: String,
    duration: Number,
    timestamp: Date,
  }],
  interactions: [{
    eventType: String,
    timestamp: Date,
    target: String,
  }],
}, { _id: false });

const literacyResultSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  
  responses: [questionResponseSchema],
  
  // Computed Scores
  score: {
    correctAnswers: Number,
    totalQuestions: Number,
    percentage: Number,
    timeFactor: Number, // bonus/penalty based on speed
    computerLiteracyScore: Number, // CLS = correct + timeFactor
  },
  
  // Performance Metrics
  metrics: {
    totalTime: Number, // milliseconds
    averageResponseTime: Number,
    totalFocusShifts: Number,
    totalHoverEvents: Number,
  },
  
  // Category Breakdown
  categoryScores: [{
    category: String, // e.g., "icons", "terminology", "navigation"
    correct: Number,
    total: Number,
  }],
});

// Auto-expire results after 1 year
literacyResultSchema.index({ completedAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model('LiteracyResult', literacyResultSchema);

