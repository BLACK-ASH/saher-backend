import { redisDatabase } from '../../redis/client.js';

export const setRedis = async (cacheKey: string, data: unknown, ttl: number = 60) => {
  const redisData = await redisDatabase.set(cacheKey, JSON.stringify(data), { EX: ttl });
};
