import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { CalendarEvent } from '../../src/database/calendar-event.model.js';
import { redisState } from '../helpers/fake-redis.js';
import type { Ctx} from '../helpers/person.js';
import { mkPerson } from '../helpers/person.js';

let plain: Ctx;

let cookie = '';
const month = (y: number, m: number) => request(app).get(`/api/calendar/${y}/${m}`).set('Cookie', cookie);

beforeEach(async () => {
  // calendar event mutations require event:write/update/delete — only admin holds all three
  plain = await mkPerson('admin');
  cookie = plain.cookie;
});

describe('calendar module', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/calendar/2026/1');
    expect(res.status).toBe(401);
  });

  it('creates an event and surfaces it in the month read', async () => {
    const create = await request(app)
      .post('/api/calendar/event')
      .set('Cookie', plain.cookie)
      .send({
        title: 'Retro',
        type: 'meeting',
        description: 'Sprint retro',
        start: '2026-03-10T10:00:00.000Z',
        end: '2026-03-10T11:00:00.000Z',
      });
    expect(create.status).toBe(201);

    // cache was invalidated by the writer — the read must include the event
    const list = await month(2026, 2);
    expect(list.status).toBe(200);
    const titles = list.body.data.map((e: { title: string }) => e.title);
    expect(titles).toContain('Retro');

    const retro = list.body.data.find((e: { title: string }) => e.title === 'Retro');
    // all CalendarEvent docs surface with the fixed 'calendar-event' type
    expect(retro.type).toBe('calendar-event');
    expect(retro.details.id).toBeTruthy();
  });

  it('rejects duplicate events with the same type and window', async () => {
    const body = {
      title: 'Standup',
      type: 'meeting',
      description: 'Daily',
      start: '2026-04-01T09:00:00.000Z',
      end: '2026-04-01T09:15:00.000Z',
    };
    await request(app).post('/api/calendar/event').set('Cookie', plain.cookie).send(body);

    const dup = await request(app)
      .post('/api/calendar/event')
      .set('Cookie', plain.cookie)
      .send(body);
    expect(dup.status).toBe(400);
  });

  it('serves the cached month after the first read', async () => {
    await request(app).post('/api/calendar/event').set('Cookie', plain.cookie).send({
      title: 'Cached Event',
      type: 'task',
      description: 'Warm the cache',
      start: '2026-05-02T08:00:00.000Z',
      end: '2026-05-02T09:00:00.000Z',
    });

    const first = await month(2026, 4);
    expect(first.status).toBe(200);
    expect(redisState.kv.size).toBeGreaterThan(0);

    const second = await month(2026, 4);
    expect(second.status).toBe(200);
    expect(second.body.data.map((e: { title: string }) => e.title)).toContain('Cached Event');
  });

  it('updates an event and busts both affected months', async () => {
    const doc = await CalendarEvent.create({
      title: 'Old Title',
      type: 'meeting',
      description: 'Before',
      start: '2026-06-01T10:00:00.000Z',
      end: '2026-06-01T11:00:00.000Z',
    });

    // warm caches for both months
    await month(2026, 5);
    await month(2026, 6);

    const upd = await request(app)
      .put(`/api/calendar/event/${doc._id}`)
      .set('Cookie', plain.cookie)
      .send({ title: 'New Title' });
    expect(upd.status).toBe(201);

    const june = await month(2026, 5);
    expect(june.body.data.map((e: { title: string }) => e.title)).toContain('New Title');
    expect(june.body.data.map((e: { title: string }) => e.title)).not.toContain('Old Title');
  });

  it('deletes an event and reflects removal on re-read', async () => {
    const doc = await CalendarEvent.create({
      title: 'Doomed',
      type: 'meeting',
      description: 'Gone soon',
      start: '2026-07-20T10:00:00.000Z',
      end: '2026-07-20T11:00:00.000Z',
    });
    await month(2026, 6);

    const del = await request(app)
      .delete(`/api/calendar/event/${doc._id}`)
      .set('Cookie', plain.cookie);
    expect(del.status).toBe(204);

    const july = await month(2026, 6);
    expect(july.body.data.map((e: { title: string }) => e.title)).not.toContain('Doomed');
  });

  it('404s when deleting an unknown or non-calendar id', async () => {
    const res = await request(app)
      .delete('/api/calendar/event/000000000000000000000000')
      .set('Cookie', plain.cookie);
    expect(res.status).toBe(404);
  });

  it('restores a soft-deleted event and re-surfaces it on the month read', async () => {
    const doc = await CalendarEvent.create({
      title: 'Phoenix',
      type: 'meeting',
      description: 'Comes back',
      start: '2026-07-20T10:00:00.000Z',
      end: '2026-07-20T11:00:00.000Z',
      isDeleted: true,
    });

    const restore = await request(app)
      .patch(`/api/calendar/event/restore/${doc._id}`)
      .set('Cookie', plain.cookie);
    expect(restore.status).toBe(200);
    expect((await CalendarEvent.findById(doc._id).lean())?.isDeleted).toBe(false);

    const july = await month(2026, 6);
    expect(july.body.data.map((e: { title: string }) => e.title)).toContain('Phoenix');

    // restore of a live event → 404
    const again = await request(app)
      .patch(`/api/calendar/event/restore/${doc._id}`)
      .set('Cookie', plain.cookie);
    expect(again.status).toBe(404);
  });
});
