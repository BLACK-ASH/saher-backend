import { Redis } from 'ioredis';
import { ApiError } from '../libs/class/api-error.js';

if (!process.env.REDIS_URL) {
  throw new ApiError(400, 'Redis Url is inivalid');
}

export const redisDatabase = new Redis(process.env.REDIS_URL);
