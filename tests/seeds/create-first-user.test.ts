import bcrypt from 'bcrypt';
import { describe, expect, it } from 'vitest';

import { Account } from '../../src/database/account.model.js';
import { Bank } from '../../src/database/bank.model.js';
import { Media } from '../../src/database/media-upload.model.js';
import { User } from '../../src/database/user.model.js';
import createFirstUser from '../../src/seeds/create-first-user.js';

// Runs against the in-memory Mongo wired up in tests/setup.ts — no docker needed.
// SEED_ADMIN_* env values come from setup.ts.

describe('seed: create-first-user', () => {
  it('fails loudly when SEED_ADMIN_PASSWORD is missing', async () => {
    // env was parsed at import; simulate absence on the parsed object
    const parsed = await import('../../src/config/env.js');
    const env = parsed.env as { SEED_ADMIN_PASSWORD?: string };
    const prevParsed = env.SEED_ADMIN_PASSWORD;
    const prevProcess = process.env.SEED_ADMIN_PASSWORD;
    delete process.env.SEED_ADMIN_PASSWORD;
    env.SEED_ADMIN_PASSWORD = undefined;

    try {
      await expect(createFirstUser()).rejects.toThrow(/SEED_ADMIN_PASSWORD/);
    } finally {
      if (prevProcess !== undefined) process.env.SEED_ADMIN_PASSWORD = prevProcess;
      if (prevParsed !== undefined) env.SEED_ADMIN_PASSWORD = prevParsed;
    }
  });

  it('creates the first admin from SEED_ADMIN_* env credentials', async () => {
    await User.deleteMany({});

    await createFirstUser();

    const admin = await User.findOne({ email: 'admin@saher.com' }).select('+password').lean();
    expect(admin).toBeTruthy();
    expect(admin!.role).toBe('admin');
    expect(admin!.emailVerified).toBe(true);
    expect(await bcrypt.compare(process.env.SEED_ADMIN_PASSWORD!, admin!.password!)).toBe(true);
  });

  it('is idempotent when users already exist', async () => {
    await createFirstUser();

    expect(await User.countDocuments({})).toBe(1);
  });

  it('concurrent seeds produce exactly one admin (unique-index race)', async () => {
    await Promise.all([
      User.deleteMany({}),
      Media.deleteMany({}),
      Bank.deleteMany({}),
      Account.deleteMany({}),
    ]);

    const results = await Promise.allSettled([createFirstUser(), createFirstUser()]);

    for (const r of results) {
      if (r.status === 'rejected') {
        expect(String(r.reason)).toMatch(/duplicate|11000|Transaction/i);
      }
    }
    expect(await User.countDocuments({ role: 'admin' })).toBe(1);
  });
});
