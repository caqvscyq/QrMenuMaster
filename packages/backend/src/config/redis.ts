import { createClient } from 'redis';
import { logger } from './logger';
import { Request, Response, NextFunction } from 'express';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Stop reconnecting after 5 attempts
      if (retries > 5) {
        logger.warn('Redis max reconnection attempts reached');
        return false;
      }
      return Math.min(retries * 100, 3000); // Increasing delay between retries
    },
    connectTimeout: 5000 // 5 seconds timeout
  }
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

// Initialize Redis connection
export const initRedis = async (): Promise<boolean> => {
  try {
    await redisClient.connect();
    logger.info('Redis client connected');
    return true;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    return false;
  }
};

// Check if Redis is available
export const isRedisAvailable = (): boolean => {
  return redisClient.isOpen;
};

// Cache middleware for frequently accessed data
export const cacheMiddleware = (key: string, expireTime: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!redisClient.isOpen) {
        return next();
      }

      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Store the original res.json method
      const originalJson = res.json;

      // Override res.json method to cache the response
      res.json = function (data: any) {
        // Cache the response data
        redisClient.setEx(key, expireTime, JSON.stringify(data))
          .catch((err) => logger.error('Redis cache error:', err));

        // Call the original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Helper functions for cache operations
export const cacheSet = async (key: string, data: any, expireTime: number = 300): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (connError) {
        logger.debug('Could not connect to Redis for cacheSet:', connError);
        return;
      }
    }
    await redisClient.setEx(key, expireTime, JSON.stringify(data));
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

export const cacheGet = async (key: string): Promise<any> => {
  try {
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (connError) {
        logger.debug('Could not connect to Redis for cacheGet:', connError);
        return null;
      }
    }
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (connError) {
        logger.debug('Could not connect to Redis for cacheDelete:', connError);
        return;
      }
    }
    await redisClient.del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
};

export const cacheFlush = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (connError) {
        logger.debug('Could not connect to Redis for cacheFlush:', connError);
        return;
      }
    }
    await redisClient.flushAll();
  } catch (error) {
    logger.error('Cache flush error:', error);
  }
};

export default redisClient;
