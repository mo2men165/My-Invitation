// server/src/config/redis.ts
import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

// Global redis cache for serverless deployment
declare global {
  var redisCache: {
    client: RedisClientType | null;
    promise: Promise<RedisClientType> | null;
  } | undefined;
}

// Initialize cache
if (!global.redisCache) {
  global.redisCache = { client: null, promise: null };
}

export const getRedisClient = async (): Promise<RedisClientType> => {
  // Check if cached client exists and is open
  if (global.redisCache!.client?.isOpen) {
    return global.redisCache!.client;
  }

  // If a connection is already being established, wait for it
  if (global.redisCache!.promise) {
    return global.redisCache!.promise;
  }

  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined in environment variables');
    }

    global.redisCache!.promise = (async () => {
      const client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            // Exponential backoff: 100ms, 200ms, 400ms
            return Math.min(retries * 100, 1000);
          },
        },
      }) as RedisClientType;

      client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      client.on('connect', () => {
        logger.info('Redis connected');
      });

      client.on('disconnect', () => {
        logger.warn('Redis disconnected');
        // Reset cache on disconnect
        if (global.redisCache) {
          global.redisCache.client = null;
          global.redisCache.promise = null;
        }
      });

      await client.connect();
      return client;
    })();

    global.redisCache!.client = await global.redisCache!.promise;
    global.redisCache!.promise = null;
    
    return global.redisCache!.client;
  } catch (error) {
    // Reset cache on connection failure
    global.redisCache!.promise = null;
    global.redisCache!.client = null;
    
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

// Legacy function for backward compatibility during startup
export const connectRedis = async (): Promise<void> => {
  await getRedisClient();
};
