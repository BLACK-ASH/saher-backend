import assert from 'node:assert';

import type { Request, Response } from 'express';

import { authorize } from './authorize.js';
import { ApiError } from '../libs/class/api-error.js';

// Minimal mock
const mockReq = (user: unknown) => ({ user }) as Request;
const mockRes = {} as Response;
const mockNext = () => {};

// Test 1: No user (Unauthorized)
try {
  authorize('read', 'user')(mockReq(undefined), mockRes, mockNext);
  assert.fail('Should have thrown 401');
} catch (error) {
  assert(error instanceof ApiError);
  assert.strictEqual(error.statusCode, 401);
}

// Test 2: User unauthorized (403)
// User (from ROLE_PERMISSIONS) doesn't have 'delete' 'user' permission
try {
  authorize('delete', 'user')(mockReq({ role: 'user' }), mockRes, mockNext);
  assert.fail('Should have thrown 403');
} catch (error) {
  assert(error instanceof ApiError);
  assert.strictEqual(error.statusCode, 403);
}
