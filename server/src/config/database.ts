// server/src/config/database.ts
import mongoose from 'mongoose';
import { logger } from './logger';

// Global mongoose cache for serverless deployment
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

// Initialize cache
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

export const connectDatabase = async (): Promise<typeof mongoose> => {
  // Return cached connection if available
  if (global.mongooseCache!.conn) {
    logger.debug('Using cached MongoDB connection');
    return global.mongooseCache!.conn;
  }

  // If a connection is already being established, wait for it
  if (global.mongooseCache!.promise) {
    logger.debug('Waiting for existing MongoDB connection promise');
    return global.mongooseCache!.promise;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Create new connection with serverless-optimized options
    global.mongooseCache!.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    global.mongooseCache!.conn = await global.mongooseCache!.promise;
    
    logger.info('MongoDB connected');
    return global.mongooseCache!.conn;
  } catch (error) {
    // Reset cache on connection failure
    global.mongooseCache!.promise = null;
    global.mongooseCache!.conn = null;
    
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  // Reset cache on disconnect
  if (global.mongooseCache) {
    global.mongooseCache.conn = null;
    global.mongooseCache.promise = null;
  }
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
  // Reset cache on error
  if (global.mongooseCache) {
    global.mongooseCache.conn = null;
    global.mongooseCache.promise = null;
  }
});
