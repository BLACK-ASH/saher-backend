import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { vi, beforeAll, afterAll, beforeEach } from 'vitest';

let mongod: MongoMemoryServer;

// Mock redis
vi.mock('../src/libs/redis/redis-client.js', () => ({
  client: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    quit: vi.fn(),
    connect: vi.fn(),
    isOpen: true,
  },
  connectRedis: vi.fn(),
  bullmqConnection: {
    host: 'localhost',
    port: 6379,
  },
}));

vi.mock('../src/libs/redis/redis-utils.js', () => ({
  createKey: (...parts: any[]) => parts.join(':'),
  getCache: vi.fn(),
  setCache: vi.fn(),
  setCacheWithGroup: vi.fn(),
  deleteCache: vi.fn(),
  deleteCacheGroup: vi.fn(),
}));

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});
