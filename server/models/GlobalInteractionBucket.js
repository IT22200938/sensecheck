import mongoose from 'mongoose';

/**
 * GlobalInteractionBucket - Bucketed Global Interaction Storage
 * 
 * Stores non-motor interactions (clicks, scrolls, form submissions, etc.)
 * across the entire application.
 */

const MAX_GLOBAL_INTERACTIONS_PER_BUCKET = 1000;

// Global interaction payload schema
const globalInteractionPayloadSchema = new mongoose.Schema({
  // Generic target info
  target: mongoose.Schema.Types.Mixed,
  
  // Pointer / mouse position
  position: {
    x: Number,
    y: Number,
  },
  
  screenPosition: {
    x: Number,
    y: Number,
  },
  
  // Input metadata
  button: String,
  key: String,
  code: String,
  pointerType: String,
  pointerId: Number,
  pressure: Number,
  
  // Page / context
  screen: String,
  url: String,
  title: String,
  
  // Timing
  duration: Number,
}, { _id: false });

// Global interaction schema
const globalInteractionSchema = new mongoose.Schema({
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  eventType: { 
    type: String, 
    required: true 
  },
  module: String,
  
  // Global interaction payload
  data: globalInteractionPayloadSchema,
}, { _id: false });

const globalInteractionBucketSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
    ref: 'Session',
  },
  
  bucketNumber: { 
    type: Number, 
    default: 1 
  },
  
  count: { 
    type: Number, 
    default: 0 
  },
  
  isFull: { 
    type: Boolean, 
    default: false 
  },
  
  firstInteractionAt: { 
    type: Date, 
    default: Date.now 
  },
  
  lastInteractionAt: { 
    type: Date, 
    default: Date.now 
  },
  
  interactions: {
    type: [globalInteractionSchema],
    default: [],
  },
}, {
  timestamps: true,
  strict: true,
});

// Indexes for efficient bucket lookup
globalInteractionBucketSchema.index({ sessionId: 1, bucketNumber: 1 });
globalInteractionBucketSchema.index({ sessionId: 1, isFull: 1 });

// TTL: Raw global interaction data expires after 90 days
globalInteractionBucketSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Pre-save validation
globalInteractionBucketSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('sessionId')) {
    const Session = mongoose.model('Session');
    const sessionExists = await Session.findOne({ sessionId: this.sessionId });
    
    if (!sessionExists) {
      const error = new Error(`Session with sessionId "${this.sessionId}" does not exist.`);
      error.name = 'SessionValidationError';
      return next(error);
    }
  }
  next();
});

// Static method to add interactions to appropriate bucket
globalInteractionBucketSchema.statics.addInteractions = async function(sessionId, interactionsArray) {
  if (!Array.isArray(interactionsArray) || interactionsArray.length === 0) {
    throw new Error('interactionsArray must be a non-empty array');
  }
  
  // Validate session exists
  const Session = mongoose.model('Session');
  const session = await Session.findOne({ sessionId });
  
  if (!session) {
    throw new Error(`Session with sessionId "${sessionId}" does not exist.`);
  }
  
  // Find current active bucket
  let bucket = await this.findOne({
    sessionId,
    isFull: false,
  }).sort({ bucketNumber: -1 });
  
  // Create new bucket if needed
  if (!bucket) {
    bucket = await this.create({
      sessionId,
      bucketNumber: 1,
      count: 0,
      interactions: [],
    });
  }
  
  // Add interactions, creating new buckets as needed
  for (const interaction of interactionsArray) {
    // Check if current bucket is full
    if (bucket.count >= MAX_GLOBAL_INTERACTIONS_PER_BUCKET) {
      bucket.isFull = true;
      await bucket.save();
      
      // Create new bucket
      bucket = await this.create({
        sessionId,
        bucketNumber: bucket.bucketNumber + 1,
        count: 0,
        interactions: [],
      });
    }
    
    // Add interaction
    bucket.interactions.push(interaction);
    bucket.count = bucket.interactions.length;
    bucket.lastInteractionAt = new Date();
  }
  
  await bucket.save();
  return bucket;
};

// Static method to get all interactions for a session
globalInteractionBucketSchema.statics.getSessionInteractions = async function(sessionId) {
  const buckets = await this.find({ sessionId }).sort({ bucketNumber: 1 });
  
  // Flatten all interactions from all buckets
  const allInteractions = [];
  for (const bucket of buckets) {
    allInteractions.push(...bucket.interactions);
  }
  
  return allInteractions;
};

const GlobalInteractionBucket = mongoose.model('GlobalInteractionBucket', globalInteractionBucketSchema);

export default GlobalInteractionBucket;


