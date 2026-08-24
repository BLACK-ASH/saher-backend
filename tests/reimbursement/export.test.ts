import { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { Bill } from '../../src/database/bill.model.js';
import type { Ctx} from '../helpers/person.js';
import { mkPerson } from '../helpers/person.js';

let admin: Ctx;
let plain: Ctx;

beforeEach(async () => {
  admin = await mkPerson('admin');
  plain = await mkPerson('user');
});

describe('GET /api/reimbursement/export/report', () => {
  it('403s plain users (read:preReimbursement required)', async () => {
    const res = await request(app)
      .get('/api/reimbursement/export/report')
      .set('Cookie', plain.cookie);
    expect(res.status).toBe(403);
  });

  it('rejects invalid filters', async () => {
    const badStatus = await request(app)
      .get('/api/reimbursement/export/report')
      .query({ status: 'bogus' })
      .set('Cookie', admin.cookie);
    expect(badStatus.status).toBe(400);

    const badDate = await request(app)
      .get('/api/reimbursement/export/report')
      .query({ from: 'not-a-date' })
      .set('Cookie', admin.cookie);
    expect(badDate.status).toBe(400);
  });

  it('short-circuits with no job when nothing matches', async () => {
    const res = await request(app)
      .get('/api/reimbursement/export/report')
      .query({ user: String(new Types.ObjectId()) })
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('enqueues a report for matching bills', async () => {
    await Bill.create({
      user: plain.userId,
      amount: 100,
      description: 'Export me',
      date: new Date(),
      images: [new Types.ObjectId()],
    });

    const res = await request(app)
      .get('/api/reimbursement/export/report')
      .query({ format: 'xlsx' })
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.jobId).toBeTruthy();
    expect(res.body.data.format).toBe('xlsx');
    expect(res.body.data.count).toBe(1);
  });
});
