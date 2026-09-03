import { createHash, randomBytes } from 'crypto';

import { Types } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { User } from '../../src/database/user.model.js';
import { hashPassword } from '../../src/libs/utils/password-hash.js';
import { redisState } from '../helpers/fake-redis.js';

const EMAIL = 'user@test.dev';
const NEW_EMAIL = 'changed@test.dev';
const PASSWORD = 'Password123!';
const TOKEN = 'a'.repeat(64); // matches /^[a-f0-9]{64}$/ token schema

const sha256hex = (v: string) => createHash('sha256').update(v).digest('hex');
const key = (...parts: string[]) => ['saher', ...parts].join(':');

const createUser = async (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: 'Test User',
    email: EMAIL,
    password: await hashPassword(PASSWORD),
    role: 'user',
    emailVerified: true,
    image: new Types.ObjectId(),
    ...overrides,
  });

const login = (email = EMAIL, password = PASSWORD) =>
  request(app).post('/api/auth/login').send({ email, password });

const setCookiesOf = (res: { headers: Record<string, unknown> }) =>
  res.headers['set-cookie'] as unknown as string[];

const cookieHeaderOf = (res: { headers: Record<string, unknown> }) =>
  setCookiesOf(res)
    .map((c) => c.split(';')[0])
    .join('; ');

// login + return response with cookies attached for follow-up requests
async function authedUser(overrides: Record<string, unknown> = {}) {
  const user = await createUser(overrides);
  const res = await login();
  expect(res.status).toBe(200);
  return { user, res, cookies: cookieHeaderOf(res) };
}

describe('Auth Module - POST /api/auth/login', () => {
  it('1. logs in with valid credentials — 200, tokens in body, session cookies set', async () => {
    await createUser();

    const res = await login();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.sessionId).toBeTruthy();

    const cookies = setCookiesOf(res).map((c) => c.split('=')[0]);
    expect(cookies).toContain('saher_access_token');
    expect(cookies).toContain('saher_refresh_token');
    expect(cookies).toContain('saher_session_id');
  });

  it('2. rejects wrong password — 401 Invalid Credentials.', async () => {
    await createUser();

    const res = await login(EMAIL, 'WrongPassword123!');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid Credentials.');
  });

  it('3. rejects unknown email — 401 (same message, no enumeration)', async () => {
    const res = await login('ghost@test.dev', PASSWORD);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid Credentials.');
  });

  it('4. rejects empty body — 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('5. rejects malformed email — 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: PASSWORD });

    expect(res.status).toBe(400);
  });

  it('6. blocks unverified email — 403 verify first', async () => {
    await createUser({ emailVerified: false });

    const res = await login();

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/verify/i);
  });

  it('7. already-logged-in user gets Already Login with existing tokens', async () => {
    await createUser();
    const first = await login();
    const cookies = cookieHeaderOf(first);

    const res = await request(app).post('/api/auth/login').set('Cookie', cookies).send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Already Login.');
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('8. login persists a server-side session in redis', async () => {
    await createUser();

    const res = await login();
    const sessionId = res.body.data.sessionId as string;

    expect(sessionId).toBeTruthy();
    expect(redisState.kv.get(key('session', sessionId))).toBeTruthy();
    expect(redisState.sets.get(key('user_session', EMAIL)) ?? new Set()).toEqual(new Set());
    // user_session is keyed by userId, not email
    const stored = JSON.parse(redisState.kv.get(key('session', sessionId))!);
    expect(stored.user.email).toBe(EMAIL);
    expect(stored.refreshTokenHash).toBeTypeOf('string');
  });
});

describe('Auth Module - POST /api/auth/logout', () => {
  it('9. requires authentication — 401 without cookies', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(401);
  });

  it('10. logs out — 200, clears cookies, deletes server-side session', async () => {
    const { cookies } = await authedUser();

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookies);

    expect(res.status).toBe(200);

    const cleared = setCookiesOf(res).map((c) => c.split(';')[0]);
    expect(cleared).toContain('saher_access_token=');
    expect(cleared).toContain('saher_refresh_token=');
  });

  it('11. after logout the old access token no longer authenticates /me', async () => {
    const { cookies } = await authedUser();

    await request(app).post('/api/auth/logout').set('Cookie', cookies);

    const res = await request(app).get('/api/auth/me').set('Cookie', cookies);

    expect(res.status).toBe(401);
  });
});

describe('Auth Module - GET /api/auth/me', () => {
  it('12. requires authentication — 401 without cookies', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('13. returns current user profile — 200', async () => {
    const { cookies } = await authedUser();

    const res = await request(app).get('/api/auth/me').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(EMAIL);
    expect(res.body.data.name).toBe('Test User');
  });

  it('14. rejects a garbage access token — 401', async () => {
    const { cookies } = await authedUser();
    const tampered = cookies.replace(/saher_access_token=[^;]*/, 'saher_access_token=garbage.token.value');

    const res = await request(app).get('/api/auth/me').set('Cookie', tampered);

    expect(res.status).toBe(401);
  });

  it('15. access token without matching session — 401 Invalid Session', async () => {
    const { user } = await authedUser();

    // craft a valid JWT for this user but pair it with a bogus session id
    const jwt = await import('jsonwebtoken');
    const accessToken = jwt.default.sign(
      { id: user._id.toString(), name: user.name, role: user.role, email: user.email },
      process.env.JWT_ACCESS_SECRET!,
      { algorithm: 'HS384', expiresIn: '15m' },
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`saher_access_token=${accessToken}`, 'saher_session_id=bogussession'].join('; '));

    expect(res.status).toBe(401);
  });

  it('16. deleted user with live session — 401 Account has been deactivated', async () => {
    const { user, cookies } = await authedUser();

    await User.deleteOne({ _id: user._id });

    const res = await request(app).get('/api/auth/me').set('Cookie', cookies);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Account Has Been Deactivated.');
  });
});

describe('Auth Module - POST /api/auth/refresh-token', () => {
  it('17. requires refresh cookies — 401 Login Required', async () => {
    const res = await request(app).post('/api/auth/refresh-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Login Required.');
  });

  it('18. rotates tokens on refresh — new refresh token differs from old', async () => {
    const { res: loginRes, cookies } = await authedUser();
    const oldRefresh = loginRes.body.data.refreshToken as string;

    const res = await request(app).post('/api/auth/refresh-token').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(EMAIL); // body.data IS the user object
    const newRefresh = setCookiesOf(res)
      .find((c) => c.startsWith('saher_refresh_token='))!
      .split(';')[0]
      .split('=')
      .slice(1)
      .join('=');
    expect(newRefresh).not.toBe(oldRefresh);
  });

  it('19. previous refresh token still works within the rotation grace window', async () => {
    const { res: loginRes, cookies } = await authedUser();
    const originalRefresh = loginRes.body.data.refreshToken;

    await request(app).post('/api/auth/refresh-token').set('Cookie', cookies);

    // reuse ORIGINAL token right after rotation — grace window (15s) allows it
    const replay = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', cookies.replace(/saher_refresh_token=[^;]*/, `saher_refresh_token=${originalRefresh}`));

    expect(replay.status).toBe(200);
  });

  it('20. refresh with unknown session — 401 Refresh Failed and cookies cleared', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', 'saher_session_id=nope; saher_refresh_token=alsowrong');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Refresh Failed.');
    const cleared = setCookiesOf(res).map((c) => c.split(';')[0]);
    expect(cleared).toContain('saher_session_id=');
  });

  it('21. tampered refresh token kills the session entirely', async () => {
    const { cookies } = await authedUser();
    const sessionId = cookies.match(/saher_session_id=([^;]+)/)![1];

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', cookies.replace(/saher_refresh_token=[^;]*/, `saher_refresh_token=${randomBytes(64).toString('hex')}`));

    expect(res.status).toBe(401);
    expect(redisState.kv.get(key('session', sessionId))).toBeUndefined();
  });
});

describe('Auth Module - GET /api/auth/sessions', () => {
  it('22. requires authentication — 401', async () => {
    const res = await request(app).get('/api/auth/sessions');

    expect(res.status).toBe(401);
  });

  it('23. lists active sessions with device metadata', async () => {
    const { cookies } = await authedUser();

    const res = await request(app).get('/api/auth/sessions').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      ip: expect.any(String),
      device: expect.any(String),
      browser: expect.any(String),
      os: expect.any(String),
    });
  });

  it('24. cleans up stale sessions instead of listing them', async () => {
    const { user, cookies } = await authedUser();
    const setKey = key('user_session', user._id.toString());

    // a set entry whose payload vanished — the listing must prune it
    redisState.sets.set(setKey, new Set([...(redisState.sets.get(setKey) ?? []), 'deadsession']));

    const res = await request(app).get('/api/auth/sessions').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(redisState.sets.get(setKey)!.has('deadsession')).toBe(false);
  });
});

describe('Auth Module - GET /api/auth/sessions/revoke/:id + revoke-all', () => {
  it('25. revoking the current session invalidates it immediately', async () => {
    const { cookies } = await authedUser();
    const sessionId = cookies.match(/saher_session_id=([^;]+)/)![1];

    const res = await request(app).get(`/api/auth/sessions/revoke/${sessionId}`).set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(redisState.kv.get(key('session', sessionId))).toBeUndefined();

    const meAfter = await request(app).get('/api/auth/me').set('Cookie', cookies);
    expect(meAfter.status).toBe(401);
  });

  it('26. revoke-all wipes every session and clears cookies', async () => {
    const { cookies } = await authedUser();

    const res = await request(app).post('/api/auth/sessions/revoke-all').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(setCookiesOf(res).map((c) => c.split(';')[0])).toContain('saher_access_token=');

    const meAfter = await request(app).get('/api/auth/me').set('Cookie', cookies);
    expect(meAfter.status).toBe(401);
  });

  it('27. revoke-all with zero sessions still succeeds', async () => {
    const { user, cookies } = await authedUser();
    // keep the live session (auth needs it) but empty the tracked set
    redisState.sets.delete(key('user_session', user._id.toString()));

    const res = await request(app).post('/api/auth/sessions/revoke-all').set('Cookie', cookies);

    expect(res.status).toBe(200);
  });
});

describe('Auth Module - verify-email', () => {
  it('28. confirm with malformed token — 400 zod rejection', async () => {
    const res = await request(app).post('/api/auth/verify-email/confirm').send({ token: 'short' });

    expect(res.status).toBe(400);
  });

  it('29. confirm with well-formed but unknown token — 400', async () => {
    const res = await request(app).post('/api/auth/verify-email/confirm').send({ token: randomBytes(32).toString('hex') });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid|expired/i);
  });

  it('30. seeded token verifies the account exactly once (one-time use)', async () => {
    const user = await createUser({ emailVerified: false });
    redisState.kv.set(key('email-verification', sha256hex(TOKEN)), JSON.stringify(user._id.toString()));

    const res = await request(app).post('/api/auth/verify-email/confirm').send({ token: TOKEN });

    expect(res.status).toBe(200);
    expect((await User.findById(user._id))!.emailVerified).toBe(true);
    expect(redisState.kv.get(key('email-verification', sha256hex(TOKEN)))).toBeUndefined();

    const replay = await request(app).post('/api/auth/verify-email/confirm').send({ token: TOKEN });
    expect(replay.status).toBe(400);
  });

  it('31. verify request requires authentication — 401', async () => {
    const res = await request(app).post('/api/auth/verify-email/request');

    expect(res.status).toBe(401);
  });
});

describe('Auth Module - change-password', () => {
  it('32. confirm with too-short password — 400', async () => {
    const res = await request(app).post('/api/auth/change-password/confirm').send({ token: TOKEN, password: 'short' });

    expect(res.status).toBe(400);
  });

  it('33. full flow changes password, revokes sessions, old password stops working', async () => {
    const { user, cookies } = await authedUser();
    redisState.kv.set(key('change-password', sha256hex(TOKEN)), JSON.stringify(user._id.toString()));

    const res = await request(app)
      .post('/api/auth/change-password/confirm')
      .send({ token: TOKEN, password: 'NewPassword456!' });

    expect(res.status).toBe(200);

    // all sessions revoked
    const meAfter = await request(app).get('/api/auth/me').set('Cookie', cookies);
    expect(meAfter.status).toBe(401);

    // new password works, old does not
    expect((await login(EMAIL, 'NewPassword456!')).status).toBe(200);
    expect((await login(EMAIL, PASSWORD)).status).toBe(401);
  });

  it('34. change-password request requires authentication — 401', async () => {
    const res = await request(app).post('/api/auth/change-password/request');

    expect(res.status).toBe(401);
  });
});

describe('Auth Module - forgot-password', () => {
  it('35. request with malformed email — 400', async () => {
    const res = await request(app).post('/api/auth/forgot-password/request').send({ email: 'junk' });

    expect(res.status).toBe(400);
  });

  it('36. request for unknown email — 404 (documented behavior)', async () => {
    const res = await request(app).post('/api/auth/forgot-password/request').send({ email: 'ghost@test.dev' });

    expect(res.status).toBe(404);
  });

  it('37. full flow resets password via email lookup', async () => {
    await createUser();
    redisState.kv.set(key('forgot-password', sha256hex(TOKEN)), JSON.stringify(EMAIL));

    const res = await request(app)
      .post('/api/auth/forgot-password/confirm')
      .send({ token: TOKEN, password: 'ResetPass789!' });

    expect(res.status).toBe(200);
    expect((await login(EMAIL, 'ResetPass789!')).status).toBe(200);
    expect((await login(EMAIL, PASSWORD)).status).toBe(401);
  });

  it('38. confirm with expired/unknown token — 400', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password/confirm')
      .send({ token: randomBytes(32).toString('hex'), password: 'Whatever123!' });

    expect(res.status).toBe(400);
  });
});

describe('Auth Module - change-email', () => {
  it('39. request requires authentication — 401', async () => {
    const res = await request(app).post('/api/auth/change-email/request').send({ email: NEW_EMAIL });

    expect(res.status).toBe(401);
  });

  it('40. request to an already-used email — 409', async () => {
    const { cookies } = await authedUser();
    await createUser({ email: NEW_EMAIL });

    const res = await request(app).post('/api/auth/change-email/request').set('Cookie', cookies).send({ email: NEW_EMAIL });

    expect(res.status).toBe(409);
  });

  it('41. confirm completes pending change and un-verifies the new address', async () => {
    const { user } = await authedUser();
    redisState.kv.set(key('change-email', sha256hex(TOKEN)), JSON.stringify({ userId: user._id.toString(), email: NEW_EMAIL }));

    const res = await request(app).post('/api/auth/change-email/confirm').send({ token: TOKEN });

    expect(res.status).toBe(200);

    const updated = await User.findById(user._id);
    expect(updated!.email).toBe(NEW_EMAIL);
    expect(updated!.emailVerified).toBe(false);

    const replay = await request(app).post('/api/auth/change-email/confirm').send({ token: TOKEN });
    expect(replay.status).toBe(400);
  });

  it('42. confirm with unknown token — 400', async () => {
    const res = await request(app).post('/api/auth/change-email/confirm').send({ token: randomBytes(32).toString('hex') });

    expect(res.status).toBe(400);
  });
});
