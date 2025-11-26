import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  // Basic device info
  userAgent: String,
  screenResolution: {
    width: Number,
    height: Number,
  },
  deviceType: String,
  
  // Enhanced device metrics
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
  
  // User demographic info
  userInfo: {
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      required: true,
    },
  },
  completedModules: [{
    moduleName: String,
    completedAt: Date,
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
  },
});

// Auto-expire sessions after 7 days
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.model('Session', sessionSchema);

