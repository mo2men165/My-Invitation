// server/src/server.ts
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { configureCloudinary } from './config/cloudinary';
import { logger } from './config/logger';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Configure Cloudinary
    configureCloudinary();

    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  gracefulShutdown();
});

startServer();
