/**
 * Unit tests for the cron secret guard — no DB or running server needed.
 * Run: pnpm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { NextFunction, Request } from 'express';

import { env } from '../../config/env.js';
import { requireCronSecret } from './cron-secret.js';

const reqWith = (headers: Record<string, string>) =>
  ({ header: (name: string) => headers[name.toLowerCase()] }) as unknown as Request;

describe('middleware: requireCronSecret', () => {
  it('accepts a correct Bearer token and calls next()', () => {
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };

    requireCronSecret(reqWith({ authorization: `Bearer ${env.CRON_SECRET}` }), {} as never, next);

    assert.equal(called, true);
  });

  it('accepts a correct x-cron-secret header', () => {
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };

    requireCronSecret(reqWith({ 'x-cron-secret': env.CRON_SECRET }), {} as never, next);

    assert.equal(called, true);
  });

  it('rejects a wrong secret with 401', () => {
    assert.throws(
      () =>
        requireCronSecret(reqWith({ authorization: 'Bearer wrong-secret' }), {} as never, () => {}),
      (err: { statusCode?: number }) => err.statusCode === 401,
    );
  });

  it('rejects a missing header with 401', () => {
    assert.throws(
      () => requireCronSecret(reqWith({}), {} as never, () => {}),
      (err: { statusCode?: number }) => err.statusCode === 401,
    );
  });

  it('rejects a prefix of the real secret (length not leaked)', () => {
    assert.throws(
      () =>
        requireCronSecret(
          reqWith({ authorization: `Bearer ${env.CRON_SECRET.slice(0, 8)}` }),
          {} as never,
          () => {},
        ),
      (err: { statusCode?: number }) => err.statusCode === 401,
    );
  });
});
