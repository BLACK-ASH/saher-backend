import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { Payroll } from '../../src/database/payroll.model.js';
import { createFullAccount } from '../helpers/account.js';
import type { Ctx} from '../helpers/person.js';
import { mkPerson } from '../helpers/person.js';

let admin: Ctx;
let manager: Ctx;
let plain: Ctx;

beforeEach(async () => {
  admin = await mkPerson('admin');
  manager = await mkPerson('manager');
  plain = await mkPerson('user');
});

describe('payroll module', () => {
  it('gates reads behind read:payroll', async () => {
    // finding: managers hold no payroll permissions at all — module is admin-only
    expect((await request(app).get('/api/payroll').set('Cookie', plain.cookie)).status).toBe(403);
    expect((await request(app).get('/api/payroll').set('Cookie', manager.cookie)).status).toBe(403);
    expect((await request(app).get('/api/payroll').set('Cookie', admin.cookie)).status).toBe(400);
  });

  it('cron generates this month payroll for accounts without one', async () => {
    const { user } = await createFullAccount({ name: 'Paid Person' }, { salaryStructure: '30000' });

    const res = await request(app).post('/api/payroll/cron').set('Cookie', admin.cookie);
    expect(res.status).toBe(200);

    const doc = await Payroll.findOne({ user: user._id }).lean();
    expect(doc?.baseSalary).toBe(30000);
    expect(doc?.status).toBe('unpaid');
    expect(doc?.workingDays).toBeGreaterThan(0);

    // idempotent — second run skips existing records
    const again = await request(app).post('/api/payroll/cron').set('Cookie', admin.cookie);
    expect(again.status).toBe(200);
    const all = await Payroll.find({ user: user._id });
    expect(all).toHaveLength(1);
  });

  it('pays a payroll in full and notifies the employee', async () => {
    const { user } = await createFullAccount({}, { salaryStructure: '25000' });
    const doc = await Payroll.create({
      user: user._id,
      dateOfCreation: new Date(),
      workingDays: 22,
      baseSalary: 25000,
      expectedSalary: 25000,
      deduction: [],
    });

    const res = await request(app)
      .put(`/api/payroll/${doc._id}`)
      .set('Cookie', admin.cookie)
      .send({ mode: 'upi', paidSalary: 25000 });
    expect(res.status).toBe(200);

    const paid = await Payroll.findById(doc._id).lean();
    expect(paid?.status).toBe('paid');
    expect(paid?.bonus).toBe(0);
    expect(paid?.dateOfPayment).toBeTruthy();

    // specific notification stored raw (unformatted) — check the payload rode along
    // via the DB rather than the formatted title
    const { Notification } = await import('../../src/database/notification.model.js');
    const note = await Notification.findOne({ user: user._id, scope: 'specific' }).lean();
    expect(note?.description).toContain('25000');
  });

  it('marks underpayment partially-paid and overpayment as bonus', async () => {
    const a = await createFullAccount({}, { salaryStructure: '10000' });
    const under = await Payroll.create({
      user: a.user._id,
      dateOfCreation: new Date(),
      workingDays: 20,
      baseSalary: 10000,
      expectedSalary: 10000,
      deduction: [],
    });
    const res = await request(app)
      .put(`/api/payroll/${under._id}`)
      .set('Cookie', admin.cookie)
      .send({ mode: 'cash', paidSalary: 8000 });
    expect(res.status).toBe(200);
    expect((await Payroll.findById(under._id))?.status).toBe('partially-paid');

    // top up the remainder
    const topUp = await request(app)
      .put(`/api/payroll/${under._id}`)
      .set('Cookie', admin.cookie)
      .send({ mode: 'cash', paidSalary: 2000 });
    expect(topUp.status).toBe(200);
    expect((await Payroll.findById(under._id))?.status).toBe('paid');

    // overpay a fresh record → bonus, fully paid
    const b = await createFullAccount({}, { salaryStructure: '12000' });
    const over = await Payroll.create({
      user: b.user._id,
      dateOfCreation: new Date(),
      workingDays: 20,
      baseSalary: 12000,
      expectedSalary: 12000,
      deduction: [],
    });
    const overRes = await request(app)
      .put(`/api/payroll/${over._id}`)
      .set('Cookie', admin.cookie)
      .send({ mode: 'cheque', paidSalary: 13000 });
    expect(overRes.status).toBe(200);
    const overDoc = (await Payroll.findById(over._id))?.toObject();
    expect(overDoc?.bonus).toBe(1000);
    expect(overDoc?.status).toBe('paid');
  });

  it('rejects zero/negative amounts and double payment', async () => {
    const { user } = await createFullAccount({}, { salaryStructure: '9000' });
    const doc = await Payroll.create({
      user: user._id,
      dateOfCreation: new Date(),
      workingDays: 20,
      baseSalary: 9000,
      expectedSalary: 9000,
      deduction: [],
    });

    const zero = await request(app)
      .put(`/api/payroll/${doc._id}`)
      .set('Cookie', admin.cookie)
      .send({ mode: 'upi', paidSalary: 0 });
    expect(zero.status).toBe(400);

    await request(app)
      .put(`/api/payroll/${doc._id}`)
      .set('Cookie', admin.cookie)
      .send({ mode: 'upi', paidSalary: 9000 });

    const twice = await request(app)
      .put(`/api/payroll/${doc._id}`)
      .set('Cookie', admin.cookie)
      .send({ mode: 'upi', paidSalary: 9000 });
    expect(twice.status).toBe(400);
  });

  it('lists by month and by user', async () => {
    const a = await createFullAccount({}, { salaryStructure: '5000' });
    const now = new Date();
    await Payroll.create([
      {
        user: a.user._id,
        dateOfCreation: new Date(now.getFullYear(), now.getMonth(), 5),
        workingDays: 20,
        baseSalary: 5000,
        expectedSalary: 5000,
        deduction: [],
      },
      {
        user: a.user._id,
        dateOfCreation: new Date(now.getFullYear(), Math.max(0, now.getMonth() - 1), 5),
        workingDays: 21,
        baseSalary: 5000,
        expectedSalary: 5000,
        deduction: [],
      },
    ]);

    const month = await request(app)
      .get(`/api/payroll?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .set('Cookie', admin.cookie);
    expect(month.status).toBe(200);
    expect(month.body.data).toHaveLength(1);

    const byUser = await request(app)
      .get(`/api/payroll/user/${a.user._id}`)
      .set('Cookie', admin.cookie);
    expect(byUser.status).toBe(200);
    expect(byUser.body.data.length).toBeGreaterThanOrEqual(2);
  });
});
