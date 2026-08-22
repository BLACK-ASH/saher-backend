import { createClient } from 'redis';

import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

export const client = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      logger.warn(`redis connection try - ${retries}`);
      if (retries > 10) {
        logger.error('redis max retry limit reached.');
        return new Error('Redis retry limit reached');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Shared BullMQ connection derived from REDIS_URL (was hardcoded to docker service name 'redis')
const redisUrl = new URL(env.REDIS_URL);
export const bullmqConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  maxRetriesPerRequest: null,
} as const;

client.on('error', (error: Error) => {
  if (error instanceof Error) logger.error(error.stack, error.message);
});

client.on('connect', () => {
  logger.info('redis connected.');
});

export const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
  }
};

// graceful shutdown
process.on('SIGINT', async () => {
  await client.quit();
  process.exit(0);
});
