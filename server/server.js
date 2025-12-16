import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from './services/logging/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import logRoutes from './routes/logs.js';
import resultsRoutes from './routes/results.js';
import motorSkillsRoutes from './routes/motorSkills.js';
import interactionBucketRoutes from './routes/interactionBuckets.js';
import motorRoutes from './routes/motor.js';
import globalRoutes from './routes/global.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api/logs', logRoutes); // Legacy - for backwards compatibility
app.use('/api/results', resultsRoutes);
app.use('/api/motor-skills', motorSkillsRoutes); // Legacy - for backwards compatibility
app.use('/api/interactions', interactionBucketRoutes); // Unified bucket API (legacy)

// ML-Ready APIs
app.use('/api/motor', motorRoutes); // Motor skills: trace, attempts, summaries
app.use('/api/global', globalRoutes); // Global interactions

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling
app.use(errorHandler);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start Server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

