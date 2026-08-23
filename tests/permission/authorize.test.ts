import type { Request } from 'express';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../../src/libs/class/api-error.js';
import { authorize } from '../../src/permission/authorize.js';

const mockReq = (user: unknown) => ({ user }) as Request;

describe('permission: authorize', () => {
  it('rejects an unauthenticated request with 401', () => {
    let thrown: unknown;
    try {
      authorize('read', 'user')(mockReq(undefined), {} as never, () => {});
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect((thrown as ApiError).statusCode).toBe(401);
  });

  it('rejects a role without the required permission with 403', () => {
    // 'user' role doesn't hold delete:user in ROLE_PERMISSIONS
    let thrown: unknown;
    try {
      authorize('delete', 'user')(mockReq({ role: 'user' }), {} as never, () => {});
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect((thrown as ApiError).statusCode).toBe(403);
  });
});
