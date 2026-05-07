import { client } from './redis-client.js';

const PREFIX = 'saher';

// create key
export const createKey = (...parts: (string | number)[]) => {
  return [PREFIX, ...parts].join(':');
};

// group key (for tracking)
export const createGroupKey = (...parts: (string | number)[]) => {
  return [PREFIX, 'group', ...parts].join(':');
};

// set cache (basic)
export const setCache = async (key: string, value: unknown, ttl = 300) => {
  await client.set(key, JSON.stringify(value), {
    EX: ttl,
  });
};

// set cache with grouping
export const setCacheWithGroup = async (
  key: string,
  value: unknown,
  group: (string | number)[],
  ttl = 300,
) => {
  const groupKey = createGroupKey(...group);

  await Promise.all([
    client.set(key, JSON.stringify(value), { EX: ttl }),
    client.sAdd(groupKey, key), // track key
  ]);
};

// get cache
export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await client.get(key);
  return data ? (JSON.parse(data) as T) : null;
};

// delete single key
export const deleteCache = async (key: string) => {
  await client.del(key);
};

// delete entire group
export const deleteCacheGroup = async (...group: (string | number)[]) => {
  const groupKey = createGroupKey(...group);

  const keys = await client.sMembers(groupKey);

  if (keys.length) {
    await client.del(keys);
  }

  await client.del(groupKey);
};
