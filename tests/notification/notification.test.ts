import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { PushSubscription } from '../../src/database/push-subscription.js';
import { User } from '../../src/database/user.model.js';
import { Ctx, mkPerson } from '../helpers/person.js';

let admin: Ctx;
let manager: Ctx;
let plain: Ctx;

beforeEach(async () => {
  admin = await mkPerson('admin');
  manager = await mkPerson('manager');
  plain = await mkPerson('user');
});

const send = (cookie: string, body: Record<string, unknown>) =>
  request(app).post('/api/notification').set('Cookie', cookie).send(body);

describe('notification module', () => {
  it('rejects unauthenticated reads', async () => {
    const res = await request(app).get('/api/notification');
    expect(res.status).toBe(401);
  });

  it('blocks plain users and admins from broadcasting', async () => {
    const body = {
      scope: 'global',
      type: 'info',
      title: 'Nope',
      description: 'Not allowed',
    };
    // finding: only managers hold write:notification — admins cannot broadcast
    expect((await send(admin.cookie, body)).status).toBe(403);
    expect((await send(plain.cookie, body)).status).toBe(403);
  });

  it('delivers global notifications to every role', async () => {
    const create = await send(manager.cookie, {
      scope: 'global',
      type: 'info',
      title: 'Townhall',
      description: 'All hands on Friday',
    });
    expect(create.status).toBe(201);

    for (const person of [admin, manager, plain]) {
      const list = await request(app)
        .get('/api/notification?page=1&limit=50')
        .set('Cookie', person.cookie);
      expect(list.status).toBe(200);
      const titles = list.body.data.map((n: { title: string }) => n.title);
      expect(titles).toContain('Townhall.');
    }
  });

  it('delivers role-scoped notifications only to that role', async () => {
    const create = await send(manager.cookie, {
      scope: 'manager',
      type: 'warn',
      title: 'Manager Only',
      description: 'For managers',
    });
    expect(create.status).toBe(201);

    const managerList = await request(app)
      .get('/api/notification?page=1&limit=50')
      .set('Cookie', manager.cookie);
    expect(managerList.body.data.map((n: { title: string }) => n.title)).toContain('Manager Only.');

    const userList = await request(app)
      .get('/api/notification?page=1&limit=50')
      .set('Cookie', plain.cookie);
    expect(userList.body.data.map((n: { title: string }) => n.title)).not.toContain('Manager Only.');
  });

  it('requires a user array for specific scope and delivers only to them', async () => {
    const missing = await send(manager.cookie, {
      scope: 'specific',
      type: 'info',
      title: 'Direct',
      description: 'No recipients given',
    });
    expect(missing.status).toBe(400);

    const create = await send(manager.cookie, {
      scope: 'specific',
      user: [plain.userId],
      type: 'info',
      title: 'Direct Message',
      description: 'Just for you',
    });
    expect(create.status).toBe(201);

    const plainList = await request(app)
      .get('/api/notification?page=1&limit=50')
      .set('Cookie', plain.cookie);
    expect(plainList.body.data.map((n: { title: string }) => n.title)).toContain('Direct Message');
  });

  it('paginates the cached per-user list', async () => {
    for (let i = 0; i < 15; i++) {
      await send(manager.cookie, {
        scope: 'specific',
        user: [plain.userId],
        type: 'info',
        title: `Note ${i}`,
        description: `Body ${i}`,
      });
    }

    const page1 = await request(app)
      .get('/api/notification?page=1&limit=10')
      .set('Cookie', plain.cookie);
    expect(page1.body.data).toHaveLength(10);
    // 15 broadcast notes + the login notification created for this session
    expect(page1.body.meta.count).toBeGreaterThanOrEqual(15);

    // second page served from the cache path
    const page2 = await request(app)
      .get('/api/notification?page=2&limit=10')
      .set('Cookie', plain.cookie);
    expect(page2.body.data).toHaveLength(page1.body.meta.count - 10);
  });

  it('marks own notifications seen and blocks IDOR', async () => {
    await send(manager.cookie, {
      scope: 'specific',
      user: [plain.userId, manager.userId],
      type: 'info',
      title: 'Seen Test',
      description: 'Mark me',
    });

    const plainList = await request(app)
      .get('/api/notification?page=1&limit=50')
      .set('Cookie', plain.cookie);
    const target = plainList.body.data.find((n: { title: string }) => n.title === 'Seen Test');
    expect(target.isSeen).toBe(false);

    const seen = await request(app).patch(`/api/notification/${target.id}`).set('Cookie', plain.cookie);
    expect(seen.status).toBe(200);
    expect(seen.body.data.isSeen).toBe(true);

    // manager was also a recipient — sees their own copy as unread
    const managerList = await request(app)
      .get('/api/notification?page=1&limit=50')
      .set('Cookie', manager.cookie);
    const managerCopy = managerList.body.data.find((n: { title: string }) => n.title === 'Seen Test');
    expect(managerCopy.isSeen).toBe(false);

    // non-recipient cannot touch someone else's notification
    const stranger = await request(app)
      .patch(`/api/notification/${target.id}`)
      .set('Cookie', admin.cookie);
    expect(stranger.status).toBe(404);
  });

  it('counts unseen notifications for the current user', async () => {
    const before = await request(app).get('/api/notification/un-seen').set('Cookie', plain.cookie);
    expect(before.status).toBe(200);

    await send(manager.cookie, {
      scope: 'specific',
      user: [plain.userId],
      type: 'info',
      title: 'Unseen Probe',
      description: 'Count me',
    });

    const after = await request(app).get('/api/notification/un-seen').set('Cookie', plain.cookie);
    expect(after.body.meta.count).toBeGreaterThan(before.body.meta.count ?? 0);
  });

  describe('web push', () => {
    const subscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
      keys: { p256dh: 'key-p256dh', auth: 'key-auth' },
    };

    it('stores subscriptions and flips the user flag', async () => {
      const res = await request(app)
        .post('/api/notification/subscribe')
        .set('Cookie', plain.cookie)
        .send(subscription);
      expect(res.status).toBe(200);

      const stored = await PushSubscription.findOne({ user: plain.userId });
      expect(stored?.endpoint).toBe(subscription.endpoint);
      expect((await User.findById(plain.userId))?.pushNotificationsEnabled).toBe(true);
    });

    it('rejects malformed payloads', async () => {
      const res = await request(app)
        .post('/api/notification/subscribe')
        .set('Cookie', manager.cookie)
        .send({ endpoint: 'not-a-url' });
      expect(res.status).toBe(400);
    });

    it('refuses to rebind an endpoint owned by another account', async () => {
      await request(app)
        .post('/api/notification/subscribe')
        .set('Cookie', plain.cookie)
        .send(subscription);

      const hijack = await request(app)
        .post('/api/notification/subscribe')
        .set('Cookie', manager.cookie)
        .send(subscription);
      expect(hijack.status).toBe(403);
    });

    it('disable removes all subscriptions and clears the flag', async () => {
      await request(app)
        .post('/api/notification/subscribe')
        .set('Cookie', plain.cookie)
        .send(subscription);

      const off = await request(app).post('/api/notification/disable').set('Cookie', plain.cookie);
      expect(off.status).toBe(200);
      expect(await PushSubscription.find({ user: plain.userId })).toHaveLength(0);
      expect((await User.findById(plain.userId))?.pushNotificationsEnabled).toBe(false);
    });
  });
});
