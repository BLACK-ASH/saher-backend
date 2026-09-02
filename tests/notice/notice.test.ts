import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { Notice } from '../../src/database/notice.model.js';
import type { Ctx} from '../helpers/person.js';
import { mkPerson } from '../helpers/person.js';

let plain: Ctx;

beforeEach(async () => {
  plain = await mkPerson('user');
});

describe('notice module', () => {
  it('creates a notice with default 7-day expiry', async () => {
    const res = await request(app)
      .post('/api/notice/')
      .set('Cookie', plain.cookie)
      .send({ title: 'Downtime', description: 'Server maintenance on Sunday' });
    expect(res.status).toBe(201);

    const doc = await Notice.findOne({ title: 'Downtime' }).lean();
    const days = (doc!.expiresAt!.getTime() - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(6);
    expect(days).toBeLessThanOrEqual(7);
  });

  it('honours explicit expiry dates', async () => {
    const future = new Date(Date.now() + 3 * 86400000).toISOString();
    await request(app)
      .post('/api/notice/')
      .set('Cookie', plain.cookie)
      .send({ title: 'Short Notice', description: 'Expires in 3 days', expiresAt: future });

    const doc = await Notice.findOne({ title: 'Short Notice' }).lean();
    const days = (doc!.expiresAt!.getTime() - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(2.9);
    expect(days).toBeLessThan(4.2);
  });

  it('rejects past expiry dates', async () => {
    const res = await request(app)
      .post('/api/notice/')
      .set('Cookie', plain.cookie)
      .send({
        title: 'Expired',
        description: 'Already gone',
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
      });
    expect(res.status).toBe(400);
  });

  it('lists only unexpired notices, newest first', async () => {
    await Notice.create([
      {
        title: 'Live One',
        description: 'Visible',
        expiresAt: new Date(Date.now() + 5 * 86400000),
      },
      {
        title: 'Dead One',
        description: 'Hidden',
        expiresAt: new Date(Date.now() - 86400000),
      },
      {
        title: 'Newer Live',
        description: 'Top of list',
        expiresAt: new Date(Date.now() + 2 * 86400000),
      },
    ]);

    const res = await request(app).get('/api/notice/').set('Cookie', plain.cookie);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((n: { title: string }) => n.title);
    expect(titles).toContain('Live One');
    expect(titles).toContain('Newer Live');
    expect(titles).not.toContain('Dead One');
    expect(titles[0]).toBe('Newer Live');
  });

  it('edits notices and returns the previous document', async () => {
    const created = await Notice.create({
      title: 'Before Edit',
      description: 'Original',
      expiresAt: new Date(Date.now() + 5 * 86400000),
    });

    // controller uses new:false — response carries the PRE-edit doc
    const res = await request(app)
      .put(`/api/notice/${created._id}`)
      .set('Cookie', plain.cookie)
      .send({ description: 'Updated body' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Original');

    expect((await Notice.findById(created._id))?.description).toBe('Updated body');
  });

  it('permanently deletes notices', async () => {
    const created = await Notice.create({
      title: 'Doomed',
      description: 'Gone',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const del = await request(app)
      .delete(`/api/notice/${created._id}/permanent`)
      .set('Cookie', plain.cookie);
    expect(del.status).toBe(200);
    expect(await Notice.findById(created._id)).toBeNull();

    const again = await request(app)
      .delete(`/api/notice/${created._id}/permanent`)
      .set('Cookie', plain.cookie);
    expect(again.status).toBe(404);
  });

  it('soft deletes, hides from list, and restores notices', async () => {
    const created = await Notice.create({
      title: 'Soft Doomed',
      description: 'Recoverable',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const del = await request(app)
      .delete(`/api/notice/${created._id}`)
      .set('Cookie', plain.cookie);
    expect(del.status).toBe(200);
    expect((await Notice.findById(created._id).lean())?.isDeleted).toBe(true);

    // soft-deleted notice is hidden from the active list
    const list = await request(app).get('/api/notice/').set('Cookie', plain.cookie);
    const titles = (list.body.data ?? []).map((n: { title: string }) => n.title);
    expect(titles).not.toContain('Soft Doomed');

    // repeat delete → 404; restore → visible flag cleared
    const again = await request(app)
      .delete(`/api/notice/${created._id}`)
      .set('Cookie', plain.cookie);
    expect(again.status).toBe(404);

    const restore = await request(app)
      .patch(`/api/notice/${created._id}/restore`)
      .set('Cookie', plain.cookie);
    expect(restore.status).toBe(200);
    expect((await Notice.findById(created._id).lean())?.isDeleted).toBe(false);
  });
});
