import mongoose from 'mongoose';

const motorSkillsInteractionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  round: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'bubble_spawn',
      'bubble_hit',
      'bubble_miss',
      'stage_clicked_miss',
      'pointer_down',
      'pointer_move',
      'pointer_up',
      'round_start',
      'round_end',
      'game_complete'
    ],
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  
  // Bubble-specific data
  bubble: {
    id: String,
    x: Number,
    y: Number,
    column: Number,
    speed: Number,
    color: String,
  },
  
  // Pointer/Mouse data
  coordinates: {
    x: Number,
    y: Number,
  },
  
  // Motor skills metrics
  velocity: {
    x: Number,
    y: Number,
    magnitude: Number,
  },
  acceleration: {
    x: Number,
    y: Number,
    magnitude: Number,
  },
  trajectory: {
    distance: Number,
    straightness: Number, // 0-1, how straight the path was
  },
  jerkiness: Number, // Measure of smoothness
  
  // Timing metrics
  reactionTime: Number, // milliseconds
  responseTime: Number, // milliseconds
  interTapInterval: Number, // milliseconds between taps
  
  // Accuracy metrics
  clickAccuracy: {
    distanceFromCenter: Number,
    hitBubble: Boolean,
    targetColumn: Number,
  },
  
  // Success metrics
  success: Boolean,
  successRate: Number, // Current success rate
  
  // Additional metadata
  pointerType: String, // mouse, touch, pen
  pressure: Number,
  metadata: mongoose.Schema.Types.Mixed,
}, { 
  strict: false, // Allow additional fields
  timestamps: true // Adds createdAt and updatedAt
});

// Compound indexes for efficient queries
motorSkillsInteractionSchema.index({ sessionId: 1, round: 1, timestamp: 1 });
motorSkillsInteractionSchema.index({ sessionId: 1, eventType: 1 });
motorSkillsInteractionSchema.index({ eventType: 1, timestamp: 1 });

// Auto-expire motor skills logs after 90 days
motorSkillsInteractionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model('MotorSkillsInteraction', motorSkillsInteractionSchema);

