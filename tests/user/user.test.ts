import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import type { Ctx} from '../helpers/person.js';
import { mkPerson } from '../helpers/person.js';

let plain: Ctx;
let other: Ctx;

beforeEach(async () => {
  plain = await mkPerson('user');
  other = await mkPerson('manager');
});

describe('user module', () => {
  it('returns own profile with account data', async () => {
    const res = await request(app).get('/api/user').set('Cookie', plain.cookie);
    expect(res.status).toBe(200);
    expect(String(res.body.data.user.id)).toBe(plain.userId);
    expect(res.body.data.bank).toBeTruthy();
  });

  it('updates own displayName and busts caches', async () => {
    // warm cache
    await request(app).get('/api/user').set('Cookie', plain.cookie);

    const upd = await request(app)
      .put('/api/user')
      .set('Cookie', plain.cookie)
      .send({ displayName: 'New Name' });
    expect(upd.status).toBe(200);

    const fresh = await request(app).get('/api/user').set('Cookie', plain.cookie);
    expect(fresh.body.data.user.displayName).toBe('New Name');
  });

  it('ignores attempts to escalate role via self-update', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Cookie', plain.cookie)
      .send({ displayName: 'Escalator', role: 'admin' } as Record<string, unknown>);
    expect(res.status).toBe(200);

    const me = await request(app).get('/api/user').set('Cookie', plain.cookie);
    expect(me.body.data.user.role).toBe('user');
  });

  it('searches users by keyword', async () => {
    const res = await request(app).get(`/api/user/${encodeURIComponent(other.email)}`).set('Cookie', plain.cookie);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((u: { id: string }) => u.id);
    expect(ids).toContain(other.userId);
  });

  it('escapes regex metacharacters in search', async () => {
    // would explode or match-everything with a raw RegExp
    const res = await request(app).get('/api/user/%28%5B%7C%5D*%2B%29').set('Cookie', plain.cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
