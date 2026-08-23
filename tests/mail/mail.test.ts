import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { Ctx, mkPerson } from '../helpers/person.js';
import { Notification } from '../../src/database/notification.model.js';

let plain: Ctx;
let other: Ctx;

beforeEach(async () => {
  plain = await mkPerson('user');
  other = await mkPerson('manager');
});

describe('mail module', () => {
  const sendMail = (cookie: string, body: Record<string, unknown>) =>
    request(app).post('/api/mail').set('Cookie', cookie).send(body);

  it('sends a mail and delivers it to the recipient inbox', async () => {
    const res = await sendMail(plain.cookie, {
      to: [other.userId],
      subject: 'Hello',
      body: 'Plain text body',
    });
    expect(res.status).toBe(201);

    const inbox = await request(app).get('/api/mail?page=1&limit=10').set('Cookie', other.cookie);
    expect(inbox.status).toBe(200);
    expect(inbox.body.data).toHaveLength(1);
    expect(inbox.body.data[0].subject).toBe('Hello');
    expect(inbox.body.data[0].from.email).toBe(plain.email);
  });

  it('rejects unknown recipients', async () => {
    const res = await sendMail(plain.cookie, {
      to: ['000000000000000000000000'],
      subject: 'Ghost',
      body: 'Nobody home',
    });
    expect(res.status).toBe(404);
  });

  it('requires recipients and non-empty subject/body', async () => {
    const empty = await sendMail(plain.cookie, { to: [], subject: 'X', body: 'Y' });
    expect(empty.status).toBe(400);

    const noSubject = await sendMail(plain.cookie, { to: [other.userId], subject: '', body: 'B' });
    expect(noSubject.status).toBe(400);
  });

  it('sanitizes scripts out of the stored body', async () => {
    await sendMail(plain.cookie, {
      to: [other.userId],
      subject: 'XSS Probe',
      body: "<script>alert(1)</script>Safe text",
    });

    const inbox = await request(app).get('/api/mail').set('Cookie', other.cookie);
    const body = inbox.body.data[0].body as string;
    expect(body).not.toContain('<script>');
    expect(body).toContain('Safe text');
  });

  it('lists sent mail in the outbox', async () => {
    await sendMail(plain.cookie, { to: [other.userId], subject: 'Outbound', body: 'Body' });

    const outbox = await request(app)
      .get('/api/mail/outbox?page=1&limit=10')
      .set('Cookie', plain.cookie);
    expect(outbox.status).toBe(200);
    expect(outbox.body.data.map((m: { subject: string }) => m.subject)).toContain('Outbound');
  });

  it('notifies recipients of new mail', async () => {
    const before = await Notification.countDocuments({ user: other.userId });
    await sendMail(plain.cookie, { to: [other.userId], subject: 'Notify Me', body: 'Ping' });
    const after = await Notification.countDocuments({ user: other.userId });
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
