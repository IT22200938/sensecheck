import mongoose from 'mongoose';

/**
 * MongoDB Bucket Pattern for Interaction Tracking
 * 
 * Instead of one document per interaction, we group interactions into buckets.
 * Benefits:
 * - Reduced database operations (batch inserts)
 * - Better query performance (fewer documents to scan)
 * - Lower storage overhead (shared metadata)
 * - Automatic bucketing by session and type
 * 
 * Each bucket stores up to MAX_INTERACTIONS_PER_BUCKET interactions.
 * When full, a new bucket is automatically created.
 */

const MAX_INTERACTIONS_PER_BUCKET = 1000;

const interactionBucketSchema = new mongoose.Schema({
  // Reference to Session
  sessionId: {
    type: String,
    required: true,
    index: true,
    ref: 'Session', // Reference to Session model
  },
  
  // Reference to Session document (for population)
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: false, // Optional - can be populated if needed
  },
  
  interactionType: {
    type: String,
    enum: ['global', 'motor'],
    required: true,
    index: true,
  },
  
  bucketNumber: {
    type: Number,
    required: true,
    default: 1,
  },
  
  // Bucket state
  count: {
    type: Number,
    required: true,
    default: 0,
  },
  
  isFull: {
    type: Boolean,
    required: true,
    default: false,
  },
  
  // Time range for this bucket
  firstInteractionAt: {
    type: Date,
    default: Date.now,
  },
  
  lastInteractionAt: {
    type: Date,
    default: Date.now,
  },
  
  // Array of interactions (the actual data)
  interactions: [{
    // Common fields for all interactions
    timestamp: {
      type: Date,
      default: Date.now,
    },
    
    eventType: {
      type: String,
      required: true,
    },
    
    module: String,
    
    // Flexible data structure for interaction details
    data: mongoose.Schema.Types.Mixed,
    
    // Global interaction fields (when interactionType === 'global')
    target: mongoose.Schema.Types.Mixed,
    position: {
      x: Number,
      y: Number,
    },
    screenPosition: {
      x: Number,
      y: Number,
    },
    button: String,
    screen: String,
    pointerType: String,
    pointerId: Number,
    pressure: Number,
    key: String,
    code: String,
    url: String,
    title: String,
    duration: Number,
    
    // Motor skills specific fields (when interactionType === 'motor')
    round: Number,
    bubbleId: String,
    column: Number,
    speed: Number,
    spawnTime: Date,
    initialPosition: {
      x: Number,
      y: Number,
    },
    currentPosition: {
      x: Number,
      y: Number,
    },
    clickPosition: {
      x: Number,
      y: Number,
    },
    reactionTime: Number,
    velocity: {
      x: Number,
      y: Number,
    },
    acceleration: {
      x: Number,
      y: Number,
    },
    trajectory: mongoose.Schema.Types.Mixed,
    jerkiness: Number,
    clickAccuracy: Number,
    successRate: Number,
    missedTargets: Number,
    interTapInterval: Number,
    roundDuration: Number,
    totalBubbles: Number,
    hitBubbles: Number,
    missedBubbles: Number,
  }],
}, {
  timestamps: true,
  // Allow flexible schema for diverse interaction data
  strict: false,
});

// Compound index for efficient bucket lookup
interactionBucketSchema.index({ sessionId: 1, interactionType: 1, bucketNumber: -1 });
interactionBucketSchema.index({ sessionId: 1, interactionType: 1, isFull: 1 });

// Pre-save middleware to validate session exists
interactionBucketSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('sessionId')) {
    // Import Session model dynamically to avoid circular dependency
    const Session = mongoose.model('Session');
    
    // Check if session exists
    const sessionExists = await Session.findOne({ sessionId: this.sessionId });
    
    if (!sessionExists) {
      const error = new Error(`Session with sessionId "${this.sessionId}" does not exist. Please create the session first.`);
      error.name = 'SessionValidationError';
      return next(error);
    }
  }
  next();
});

// Virtual field to populate session details
interactionBucketSchema.virtual('sessionDetails', {
  ref: 'Session',
  localField: 'sessionId',
  foreignField: 'sessionId',
  justOne: true,
});

// Enable virtuals in JSON and Object outputs
interactionBucketSchema.set('toJSON', { virtuals: true });
interactionBucketSchema.set('toObject', { virtuals: true });

// Static method to add interaction to appropriate bucket
interactionBucketSchema.statics.addInteraction = async function(sessionId, interactionType, interactionData) {
  // Validate that session exists before adding interactions
  const Session = mongoose.model('Session');
  const session = await Session.findOne({ sessionId });
  
  if (!session) {
    throw new Error(`Session with sessionId "${sessionId}" does not exist. Please create the session first.`);
  }
  
  // Find the current active bucket for this session and type
  let bucket = await this.findOne({
    sessionId,
    interactionType,
    isFull: false,
  }).sort({ bucketNumber: -1 });
  
  // If no active bucket exists, create one
  if (!bucket) {
    bucket = await this.create({
      sessionId,
      interactionType,
      bucketNumber: 1,
      count: 0,
      interactions: [],
    });
  }
  
  // Check if bucket is full
  if (bucket.count >= MAX_INTERACTIONS_PER_BUCKET) {
    // Mark current bucket as full
    bucket.isFull = true;
    await bucket.save();
    
    // Create new bucket
    bucket = await this.create({
      sessionId,
      interactionType,
      bucketNumber: bucket.bucketNumber + 1,
      count: 0,
      interactions: [],
    });
  }
  
  // Add interaction to bucket
  bucket.interactions.push(interactionData);
  bucket.count = bucket.interactions.length;
  bucket.lastInteractionAt = new Date();
  
  await bucket.save();
  
  return bucket;
};

// Static method to add multiple interactions (batch)
interactionBucketSchema.statics.addInteractions = async function(sessionId, interactionType, interactionsArray) {
  const results = [];
  
  for (const interaction of interactionsArray) {
    const bucket = await this.addInteraction(sessionId, interactionType, interaction);
    results.push(bucket);
  }
  
  return results;
};

// Static method to get all interactions for a session
interactionBucketSchema.statics.getSessionInteractions = async function(sessionId, interactionType = null) {
  const query = { sessionId };
  if (interactionType) {
    query.interactionType = interactionType;
  }
  
  const buckets = await this.find(query).sort({ bucketNumber: 1 });
  
  // Flatten all interactions from all buckets
  const allInteractions = [];
  for (const bucket of buckets) {
    allInteractions.push(...bucket.interactions);
  }
  
  return allInteractions;
};

// Static method to get bucket statistics
interactionBucketSchema.statics.getSessionStats = async function(sessionId) {
  const globalBuckets = await this.find({ sessionId, interactionType: 'global' });
  const motorBuckets = await this.find({ sessionId, interactionType: 'motor' });
  
  const globalCount = globalBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const motorCount = motorBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  
  return {
    sessionId,
    global: {
      bucketCount: globalBuckets.length,
      interactionCount: globalCount,
      buckets: globalBuckets.map(b => ({
        bucketNumber: b.bucketNumber,
        count: b.count,
        isFull: b.isFull,
        timeRange: {
          first: b.firstInteractionAt,
          last: b.lastInteractionAt,
        },
      })),
    },
    motor: {
      bucketCount: motorBuckets.length,
      interactionCount: motorCount,
      buckets: motorBuckets.map(b => ({
        bucketNumber: b.bucketNumber,
        count: b.count,
        isFull: b.isFull,
        timeRange: {
          first: b.firstInteractionAt,
          last: b.lastInteractionAt,
        },
      })),
    },
    total: globalCount + motorCount,
  };
};

const InteractionBucket = mongoose.model('InteractionBucket', interactionBucketSchema);

export default InteractionBucket;

