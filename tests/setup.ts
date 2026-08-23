process.env.NODE_ENV = 'test';
process.env.SEED_ADMIN_PASSWORD = 'password123456';
process.env.SEED_ADMIN_EMAIL = 'admin@saher.com';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.BASE_URL = 'http://localhost:4001';
process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
process.env.CRON_SECRET = 'b'.repeat(32);
process.env.RESEND_API_KEY = 'a'.repeat(20);
process.env.VAPID_PUBLIC_KEY = 'public';
process.env.VAPID_PRIVATE_KEY = 'private';
// integration tests make hundreds of auth calls — disable rate limiting
process.env.RATE_LIMIT_AUTH = '100000';
process.env.RATE_LIMIT_API = '100000';

import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { vi, beforeAll, afterAll, beforeEach } from 'vitest';

import { redisState } from './helpers/fake-redis.js';

vi.mock('../src/libs/redis/redis-client.js', async () => {
  const { fakeRedis } = await import('./helpers/fake-redis.js');
  return {
    client: fakeRedis,
    connectRedis: vi.fn(),
    bullmqConnection: { host: 'localhost', port: 6379 },
  };
});

// Resend would attempt real HTTP calls — stub the transport only
vi.mock('../src/libs/mail/resend-send-mail.js', () => ({
  sendEmail: vi.fn(async () => ({ data: { id: 'test-email-id' } })),
}));

let mongod: MongoMemoryReplSet;

beforeAll(async () => {
  // replica set — the codebase uses MongoDB transactions (seeds, attendance)
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(await mongod.getUri());
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  redisState.kv.clear();
  redisState.sets.clear();
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});
