// server/src/server.ts
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { configureCloudinary } from './config/cloudinary';
import { logger } from './config/logger';
import { initializeTabbyWebhook } from './services/tabbyWebhookRegistration';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Configure Cloudinary
    configureCloudinary();

    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Register Tabby webhook (only once, non-blocking)
    initializeTabbyWebhook().catch(err => {
      logger.warn('Tabby webhook registration failed (non-critical):', err.message);
    });

    // Only start the server if NOT in Vercel environment
    // Vercel uses api/index.ts as entry point instead
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Shutdown (${signal})`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

// Export app for Vercel compatibility
export default app;
