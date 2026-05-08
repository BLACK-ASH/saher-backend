import { createClient } from 'redis';

import 'dotenv/config';
import { logger } from '../logger/logger.js';

export const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
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
