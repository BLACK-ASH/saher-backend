/**
 * Seed tests — run ONLY against the local dev mongo from docker-compose.dev.yml:
 *   docker compose -f docker-compose.dev.yml up -d
 *   pnpm test
 *
 * WARNING: drops all users in the target database (uses MONGO_URI from env).
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

import createFirstUser from './create-first-user.js';
import { env } from '../config/env.js';
import { Account } from '../database/account.model.js';
import { Bank } from '../database/bank.model.js';
import { Media } from '../database/media-upload.model.js';
import { User } from '../database/user.model.js';

before(async () => {
  await mongoose.connect(env.MONGO_URI);
  await Promise.all([
    User.deleteMany({}),
    Media.deleteMany({}),
    Bank.deleteMany({}),
    Account.deleteMany({}),
  ]);
});

after(async () => {
  await mongoose.disconnect();
});

describe('seed: create-first-user', () => {
  it('fails loudly when SEED_ADMIN_PASSWORD is missing', async () => {
    const saved = process.env.SEED_ADMIN_PASSWORD;
    delete process.env.SEED_ADMIN_PASSWORD;
    // env was parsed at import; simulate absence on the parsed object
    const parsed = env as { SEED_ADMIN_PASSWORD?: string };
    const prev = parsed.SEED_ADMIN_PASSWORD;
    parsed.SEED_ADMIN_PASSWORD = undefined;

    try {
      await assert.rejects(() => createFirstUser(), /SEED_ADMIN_PASSWORD/);
    } finally {
      if (saved !== undefined) process.env.SEED_ADMIN_PASSWORD = saved;
      parsed.SEED_ADMIN_PASSWORD = prev;
    }
  });

  it('creates the first admin from SEED_ADMIN_* env credentials', async () => {
    await User.deleteMany({});

    await createFirstUser();

    const admin = await User.findOne({ email: env.SEED_ADMIN_EMAIL || 'admin@saher.com' }).lean();
    assert.ok(admin, 'admin user not created');
    assert.equal(admin.role, 'admin');
    assert.equal(admin.emailVerified, true);
    assert.ok(await bcrypt.compare(env.SEED_ADMIN_PASSWORD!, admin.password!));
  });

  it('is idempotent when users already exist', async () => {
    await createFirstUser();

    assert.equal(await User.countDocuments({}), 1);
  });

  it('concurrent seeds produce exactly one admin (unique-index race)', async () => {
    await User.deleteMany({});

    const results = await Promise.allSettled([createFirstUser(), createFirstUser()]);

    for (const r of results) {
      if (r.status === 'rejected') {
        assert.match(String(r.reason), /(duplicate|11000|Transaction)/i);
      }
    }
    assert.equal(await User.countDocuments({ role: 'admin' }), 1);
  });
});
