import mongoose from 'mongoose';

const colorBlindnessPlateSchema = new mongoose.Schema({
  plateId: {
    type: Number,
    required: true,
  },
  imageName: String,
  userAnswer: {
    type: String, // Can be number or "nothing"
    required: true,
  },
  responseTime: Number, // milliseconds
  isCorrect: Boolean,
  interactions: [{
    eventType: String,
    timestamp: Date,
  }],
}, { _id: false });

const visualAcuityAttemptSchema = new mongoose.Schema({
  size: {
    type: Number,
    required: true,
  },
  number: Number,
  userAnswer: Number,
  isCorrect: Boolean,
  responseTime: Number,
  attemptNumber: Number, // 1 or 2 (for retry)
}, { _id: false });

const visionResultSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Color Blindness Test Results
  colorBlindness: {
    plates: [colorBlindnessPlateSchema],
    colorVisionScore: Number,
    diagnosis: {
      type: String,
      enum: ['Normal', 'Suspected Red-Green Deficiency', 'Inconclusive'],
    },
    totalResponseTime: Number,
  },
  
  // Visual Acuity Test Results
  visualAcuity: {
    attempts: [visualAcuityAttemptSchema],
    finalResolvedSize: Number, // in pixels
    visualAngle: Number, // in degrees
    mar: Number, // Minimum Angle of Resolution
    snellenDenominator: Number,
    snellenEstimate: String, // e.g., "20/40"
    totalResponseTime: Number,
  },
  
  // Metadata
  testConditions: {
    screenSize: {
      width: Number,
      height: Number,
    },
    viewingDistance: Number, // estimated or user-provided in cm
    brightness: Number,
    timeOfDay: String,
  },
});

// Auto-expire results after 1 year
visionResultSchema.index({ completedAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model('VisionResult', visionResultSchema);

