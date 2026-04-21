import { client } from './redis-client.js';

export const createKey = (...parts: (string | number)[]) => {
  return ['saher', ...parts].join(':');
};

export const setCache = async (key: string, value: unknown, ttl = 300) => {
  await client.set(key, JSON.stringify(value), {
    EX: ttl,
  });
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await client.get(key);
  return data ? (JSON.parse(data) as T) : null;
};

export const deleteCache = async (key: string) => {
  await client.del(key);
};
