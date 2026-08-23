import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { LeaveBalance } from '../../src/database/leave-balance.model.js';
import { LeaveType } from '../../src/database/leave-type.model.js';
import type { Ctx} from '../helpers/person.js';
import { mkPerson } from '../helpers/person.js';

let admin: Ctx;
let manager: Ctx;
let plain: Ctx;

const day = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

beforeEach(async () => {
  admin = await mkPerson('admin');
  manager = await mkPerson('manager');
  plain = await mkPerson('user');
});

const makeType = async (overrides: Record<string, unknown> = {}) =>
  LeaveType.create({
    name: 'Casual Leave',
    code: 'CL',
    allocatedDays: 12,
    maxCarryForwardDays: 4,
    requiresProof: false,
    minDaysNotice: 0,
    isActive: true,
    createdBy: admin.userId,
    ...overrides,
  });

describe('leave module', () => {
  describe('leave types', () => {
    it('admins create leave types; managers cannot', async () => {
      const ok = await request(app)
        .post('/api/leave/type')
        .set('Cookie', admin.cookie)
        .send({
          name: 'Sick Leave',
          code: 'sl',
          allocatedDays: 10,
          maxCarryForwardDays: 2,
          requiresProof: true,
          minDaysNotice: 1,
        });
      expect(ok.status).toBe(201);

      const denied = await request(app).post('/api/leave/type').set('Cookie', manager.cookie).send({
        name: 'Nope',
        code: 'NP',
        allocatedDays: 5,
        maxCarryForwardDays: 0,
        requiresProof: false,
        minDaysNotice: 0,
      });
      expect(denied.status).toBe(403);
    });

    it('rejects duplicate codes case-insensitively and bad carry-forward', async () => {
      await makeType();

      const dup = await request(app).post('/api/leave/type').set('Cookie', admin.cookie).send({
        name: 'Other',
        code: 'cl',
        allocatedDays: 5,
        maxCarryForwardDays: 0,
        requiresProof: false,
        minDaysNotice: 0,
      });
      expect(dup.status).toBe(400);

      const carry = await request(app).post('/api/leave/type').set('Cookie', admin.cookie).send({
        name: 'Bad Carry',
        code: 'BC',
        allocatedDays: 2,
        maxCarryForwardDays: 5,
        requiresProof: false,
        minDaysNotice: 0,
      });
      expect(carry.status).toBe(400);
    });

    it('updates types (admin only) and lists them', async () => {
      const type = await makeType();

      const upd = await request(app)
        .put(`/api/leave/type/${type._id}`)
        .set('Cookie', admin.cookie)
        .send({ allocatedDays: 20 });
      expect(upd.status).toBe(200);
      expect((await LeaveType.findById(type._id))?.allocatedDays).toBe(20);

      const forbidden = await request(app)
        .put(`/api/leave/type/${type._id}`)
        .set('Cookie', manager.cookie)
        .send({ allocatedDays: 30 });
      expect(forbidden.status).toBe(403);

      const list = await request(app).get('/api/leave/type').set('Cookie', plain.cookie);
      expect(list.status).toBe(200);
      expect(list.body.data.some((t: { code: string }) => t.code === 'CL')).toBe(true);
    });
  });

  describe('applications', () => {
    it('applies for leave with validation chain', async () => {
      await makeType({ code: 'EL', name: 'Earned Leave', minDaysNotice: 5 });

      // end before start
      const inverted = await request(app)
        .post('/api/leave/application/apply')
        .set('Cookie', plain.cookie)
        .send({ type: 'EL', startDate: day(10), endDate: day(9), reason: 'Family function' });
      expect(inverted.status).toBe(400);

      // insufficient notice
      const late = await request(app)
        .post('/api/leave/application/apply')
        .set('Cookie', plain.cookie)
        .send({ type: 'EL', startDate: day(2), endDate: day(3), reason: 'Family function' });
      expect(late.status).toBe(400);

      const ok = await request(app)
        .post('/api/leave/application/apply')
        .set('Cookie', plain.cookie)
        .send({ type: 'EL', startDate: day(10), endDate: day(11), reason: 'Family function' });
      expect(ok.status).toBe(201);

      // overlapping pending request
      const overlap = await request(app)
        .post('/api/leave/application/apply')
        .set('Cookie', plain.cookie)
        .send({ type: 'EL', startDate: day(11), endDate: day(12), reason: 'Overlap attempt' });
      expect(overlap.status).toBe(400);

      // unknown type code
      const unknown = await request(app)
        .post('/api/leave/application/apply')
        .set('Cookie', plain.cookie)
        .send({ type: 'ZZ', startDate: day(20), endDate: day(21), reason: 'Ghost type' });
      expect(unknown.status).toBe(404);
    });

    it('lists own applications and gates the all endpoint', async () => {
      await makeType({ code: 'PL', name: 'Paternity' });
      await request(app).post('/api/leave/application/apply').set('Cookie', plain.cookie).send({
        type: 'PL',
        startDate: day(7),
        endDate: day(8),
        reason: 'Childbirth support',
      });

      const mine = await request(app).get('/api/leave/application').set('Cookie', plain.cookie);
      expect(mine.status).toBe(200);
      expect(mine.body.data).toHaveLength(1);
      expect(mine.body.data[0].type.code).toBe('PL');
      expect(mine.body.data[0].status).toBe('pending');

      const allDenied = await request(app)
        .get('/api/leave/application/all')
        .set('Cookie', plain.cookie);
      expect(allDenied.status).toBe(400);

      const allOk = await request(app)
        .get('/api/leave/application/all')
        .set('Cookie', manager.cookie);
      expect(allOk.status).toBe(200);
      expect(allOk.body.data).toHaveLength(1);
    });

    it('applicants edit only their own pending applications', async () => {
      await makeType({ code: 'ML', name: 'Medical', requiresProof: true });
      await request(app).post('/api/leave/application/apply').set('Cookie', plain.cookie).send({
        type: 'ML',
        startDate: day(6),
        endDate: day(6),
        reason: 'Surgery recovery',
        proof: '000000000000000000000000',
      });
      const mine = (
        await request(app).get('/api/leave/application').set('Cookie', plain.cookie)
      ).body.data[0];

      const upd = await request(app)
        .put(`/api/leave/application/update/${mine.id}`)
        .set('Cookie', plain.cookie)
        .send({ endDate: day(8), proof: '000000000000000000000001' });
      expect(upd.status).toBe(200);
      expect(upd.body.data.totalDays).toBe(3);

      const stranger = await request(app)
        .put(`/api/leave/application/update/${mine.id}`)
        .set('Cookie', manager.cookie)
        .send({ reason: 'Hijack attempt' });
      expect(stranger.status).toBe(403);
    });

    it('reviews applications, records usage, blocks double review', async () => {
      await makeType({ code: 'AL', name: 'Annual' });
      await request(app).post('/api/leave/application/apply').set('Cookie', plain.cookie).send({
        type: 'AL',
        startDate: day(9),
        endDate: day(10),
        reason: 'Vacation trip',
      });
      const appId = (
        await request(app).get('/api/leave/application').set('Cookie', plain.cookie)
      ).body.data[0].id;

      // plain users hold update:leave but the controller restricts reviews
      const denied = await request(app)
        .put(`/api/leave/application/review/${appId}`)
        .set('Cookie', plain.cookie)
        .send({ status: 'approved' });
      expect(denied.status).toBe(403);

      const approve = await request(app)
        .put(`/api/leave/application/review/${appId}`)
        .set('Cookie', manager.cookie)
        .send({ status: 'approved', managerComment: 'Enjoy' });
      expect(approve.status).toBe(200);

      // usage recorded against the balance ledger
      const ledger = await LeaveBalance.findOne({ user: plain.userId });
      expect(ledger?.used.get('AL')).toBe(2);

      // double review blocked
      const again = await request(app)
        .put(`/api/leave/application/review/${appId}`)
        .set('Cookie', admin.cookie)
        .send({ status: 'rejected' });
      expect(again.status).toBe(400);

      // editing an approved application is blocked
      const editApproved = await request(app)
        .put(`/api/leave/application/update/${appId}`)
        .set('Cookie', plain.cookie)
        .send({ reason: 'Too late' });
      expect(editApproved.status).toBe(400);
    });

    it('rejects review of unknown ids', async () => {
      const res = await request(app)
        .put('/api/leave/application/review/000000000000000000000000')
        .set('Cookie', admin.cookie)
        .send({ status: 'approved' });
      expect(res.status).toBe(404);
    });
  });

  describe('balance', () => {
    it('reports used/remaining per active leave type', async () => {
      await makeType({ code: 'BL', name: 'Birthday' });
      await LeaveBalance.create({
        user: plain.userId,
        year: String(new Date().getFullYear()),
        used: { BL: 1 },
      });

      const res = await request(app).get('/api/leave/balance').set('Cookie', plain.cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.balance['Birthday']).toEqual({ used: 1, remaining: 11 });
    });

    it('404s without a balance record', async () => {
      const res = await request(app).get('/api/leave/balance').set('Cookie', manager.cookie);
      expect(res.status).toBe(404);
    });
  });
});
