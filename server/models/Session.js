import mongoose from 'mongoose';

/**
 * SessionMeta - ML-Ready Session Metadata
 * 
 * This schema stores all session-level information needed for ML training:
 * - Device capabilities and constraints
 * - Game configuration and versioning
 * - Performance quality metrics
 * - Demographics (privacy-preserving)
 */

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Anonymized stable participant identifier (NOT userId/email)
  participantId: {
    type: String,
    required: true,
    index: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
    index: true,
  },
  
  // ===== Legacy device info (kept for backwards compatibility) =====
  userAgent: String,
  screenResolution: {
    width: Number,
    height: Number,
  },
  deviceType: String,
  preferredTheme: String,
  viewportWidth: Number,
  viewportHeight: Number,
  highContrastMode: Boolean,
  reducedMotionPreference: Boolean,
  devicePixelRatio: Number,
  hardwareConcurrency: Number,
  pageLoadTime: Number,
  connectionType: String,
  memory: Number,
  platform: String,
  language: String,
  
  // ===== NEW: Normalized device block (helps ML + reduces ambiguity) =====
  device: {
    pointerPrimary: {
      type: String,
      enum: ['mouse', 'touch', 'pen', 'unknown'],
      default: 'unknown',
      index: true,
    },
    os: String,
    browser: String,
  },
  
  screen: {
    width: Number,
    height: Number,
    dpr: Number,
  },
  
  // ===== NEW: Game + metrics versioning =====
  game: {
    gameVersion: { type: String, required: true },      // e.g., "1.2.0"
    metricsVersion: { type: String, required: true },   // e.g., "ms-v3"
    difficultyPreset: { type: String },                 // "baseline" / "hard"
    roundCount: { type: Number, default: 3 },
    columns: { type: Number, default: 5 },
    
    // Needed for Fitts + normalization
    bubbleRadiusPx: { type: Number, required: true },
    bubbleTTLms: { type: Number, required: true },
    
    spawnRate: Number, // optional
  },
  
  // ===== NEW: Performance quality signals (prevents "slow PC" == impaired) =====
  perf: {
    samplingHzTarget: { type: Number, default: 60 },
    samplingHzEstimated: Number,
    avgFrameMs: Number,
    p95FrameMs: Number,
    droppedFrames: Number,
    inputLagMsEstimate: Number,
  },
  
  // ===== Demographics (privacy-preserving) =====
  userInfo: {
    age: { 
      type: Number, 
      min: 1, 
      max: 120 
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    
    // Recommended: store ageBucket instead of exact age for privacy
    ageBucket: {
      type: String,
      enum: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'unknown'],
      default: 'unknown',
      index: true,
    },
  },
  
  completedModules: [{
    moduleName: String,
    completedAt: Date,
  }],
});

// TTL Strategy: SessionMeta kept longer than raw interaction buckets
// Keep sessions for 1 year (for longitudinal analysis)
// Raw buckets have separate 90-day TTL
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 365 days

// Virtual field to get all interaction buckets for this session
sessionSchema.virtual('interactionBuckets', {
  ref: 'InteractionBucket',
  localField: 'sessionId',
  foreignField: 'sessionId',
});

// Method to get interaction statistics for this session
sessionSchema.methods.getInteractionStats = async function() {
  const InteractionBucket = mongoose.model('InteractionBucket');
  return await InteractionBucket.getSessionStats(this.sessionId);
};

// Method to get all interactions for this session
sessionSchema.methods.getAllInteractions = async function(interactionType = null) {
  const InteractionBucket = mongoose.model('InteractionBucket');
  return await InteractionBucket.getSessionInteractions(this.sessionId, interactionType);
};

// Method to delete all associated interaction buckets
sessionSchema.methods.deleteInteractionBuckets = async function() {
  const InteractionBucket = mongoose.model('InteractionBucket');
  const result = await InteractionBucket.deleteMany({ sessionId: this.sessionId });
  return result.deletedCount;
};

// Pre-remove hook to clean up associated buckets and summaries
sessionSchema.pre('remove', async function(next) {
  try {
    // Delete all bucket types
    const InteractionBucket = mongoose.model('InteractionBucket');
    const GlobalInteractionBucket = mongoose.model('GlobalInteractionBucket');
    const MotorPointerTraceBucket = mongoose.model('MotorPointerTraceBucket');
    const MotorAttemptBucket = mongoose.model('MotorAttemptBucket');
    
    await Promise.all([
      InteractionBucket.deleteMany({ sessionId: this.sessionId }),
      GlobalInteractionBucket.deleteMany({ sessionId: this.sessionId }),
      MotorPointerTraceBucket.deleteMany({ sessionId: this.sessionId }),
      MotorAttemptBucket.deleteMany({ sessionId: this.sessionId }),
    ]);
    
    // Delete summaries
    const { MotorRoundSummary, MotorSessionSummary } = await import('./MotorSummary.js');
    await Promise.all([
      MotorRoundSummary.deleteMany({ sessionId: this.sessionId }),
      MotorSessionSummary.deleteMany({ sessionId: this.sessionId }),
    ]);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Enable virtuals in JSON and Object outputs
sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

const Session = mongoose.model('Session', sessionSchema);

export default Session;

