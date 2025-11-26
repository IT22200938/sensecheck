import mongoose from 'mongoose';

const interactionLogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  module: {
    type: String,
    required: true,
    enum: ['global', 'colorBlindness', 'visualAcuity', 'literacy'],
    index: true,
    // Note: motorSkills has its own collection (MotorSkillsInteraction)
  },
  eventType: {
    type: String,
    required: true,
    // click, hover, focus, blur, mousedown, mouseup, touchstart, touchend, mousemove, etc.
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  coordinates: {
    x: Number,
    y: Number,
  },
  target: {
    type: mongoose.Schema.Types.Mixed,
    // Can store: { id, class, text, type, name, tag, value, etc. }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // Can store: pressure, touchArea, velocity, trajectory, etc.
  },
  // Additional flexible fields for various event types
  button: Number,
  screen: mongoose.Schema.Types.Mixed,
  movement: mongoose.Schema.Types.Mixed,
  pointerType: String,
  pressure: Number,
  key: String,
  code: String,
  modifiers: mongoose.Schema.Types.Mixed,
  touches: mongoose.Schema.Types.Mixed,
  pointerId: Number,
  width: Number,
  height: Number,
  tiltX: Number,
  tiltY: Number,
  twist: Number,
  responseTime: Number, // milliseconds
  duration: Number, // for touch/press duration
  url: String,
  timeOnPage: Number,
}, { 
  strict: false // Allow additional fields not defined in schema
});

// Compound index for efficient queries
interactionLogSchema.index({ sessionId: 1, module: 1, timestamp: 1 });

// Auto-expire interaction logs after 90 days
interactionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model('InteractionLog', interactionLogSchema);

