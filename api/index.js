import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';

// Import routes
import resultsRoutes from '../server/routes/results.js';
import motorRoutes from '../server/routes/motor.js';
import impairmentRoutes from '../server/routes/impairment.js';
import deviceContextRoutes from '../server/routes/deviceContext.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// Compression
app.use(compression());

// CORS - allow all origins
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no DB required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoConfigured: !!process.env.MONGODB_URI,
  });
});

// MongoDB Connection (with connection caching for serverless)
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    cachedConnection = conn;
    console.log('MongoDB connected');
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    cachedConnection = null;
    throw error;
  }
}

// DB Connection middleware
app.use('/api', async (req, res, next) => {
  // Skip health check
  if (req.path === '/health') {
    return next();
  }
  
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database error:', error.message);
    return res.status(500).json({ 
      success: false,
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Routes
app.use('/api/results', resultsRoutes);
app.use('/api/motor', motorRoutes);
app.use('/api/impairment', impairmentRoutes);
app.use('/api/device-context', deviceContextRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Export for Vercel
export default app;
