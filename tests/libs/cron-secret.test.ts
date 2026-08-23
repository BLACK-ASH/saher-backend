import type { NextFunction, Request } from 'express';
import { describe, expect, it } from 'vitest';

import { env } from '../../src/config/env.js';
import { ApiError } from '../../src/libs/class/api-error.js';
import { requireCronSecret } from '../../src/libs/middleware/cron-secret.js';

const reqWith = (headers: Record<string, string>) =>
  ({ header: (name: string) => headers[name.toLowerCase()] }) as unknown as Request;

describe('middleware: requireCronSecret', () => {
  it('accepts a correct Bearer token and calls next()', () => {
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };

    requireCronSecret(reqWith({ authorization: `Bearer ${env.CRON_SECRET}` }), {} as never, next);

    expect(called).toBe(true);
  });

  it('accepts a correct x-cron-secret header', () => {
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };

    requireCronSecret(reqWith({ 'x-cron-secret': env.CRON_SECRET }), {} as never, next);

    expect(called).toBe(true);
  });

  it('rejects a wrong secret with 401', () => {
    let thrown: unknown;
    try {
      requireCronSecret(reqWith({ authorization: 'Bearer wrong-secret' }), {} as never, () => {});
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect((thrown as ApiError).statusCode).toBe(401);
  });

  it('rejects a missing header with 401', () => {
    let thrown: unknown;
    try {
      requireCronSecret(reqWith({}), {} as never, () => {});
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect((thrown as ApiError).statusCode).toBe(401);
  });

  it('rejects a prefix of the real secret (length not leaked)', () => {
    let thrown: unknown;
    try {
      requireCronSecret(
        reqWith({ authorization: `Bearer ${env.CRON_SECRET.slice(0, 8)}` }),
        {} as never,
        () => {},
      );
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect((thrown as ApiError).statusCode).toBe(401);
  });
});
