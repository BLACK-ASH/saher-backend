import { createClient } from 'redis';
import 'dotenv/config';

export const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Redis retry limit reached');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

client.on('error', (err: Error) => {
  console.error('Redis Client Error', err);
});

client.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('Redis connected');
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
