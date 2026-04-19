import { createClient } from 'redis';
import { ApiError } from '../libs/class/api-error.js';

if (!process.env.REDIS_URL) {
  throw new ApiError(400, 'Redis Url is inivalid');
}

export const redisDatabase = createClient({ url: process.env.REDIS_URL });

redisDatabase.on('error', (error) => {
  console.error(error);
});

export const connectRedis = async () => {
  if (!redisDatabase.isOpen) {
    await redisDatabase.connect();
  }
};
