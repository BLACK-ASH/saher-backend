import { Types } from 'mongoose';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../src/app.js';
import { AttendanceCorrection } from '../../src/database/attendance-correction.model.js';
import { Attendance } from '../../src/database/attendance.model.js';
import { Holiday } from '../../src/database/holiday.model.js';
import { Leave } from '../../src/database/leave.model.js';
import { Notification } from '../../src/database/notification.model.js';
import { redisState } from '../helpers/fake-redis.js';
import { cookieOf, mkPerson, mkUserOnly } from '../helpers/person.js';

// Fixed IST clock: Wed 2026-08-19, 10:00:00 IST (03:30Z). Shift math asserts are exact under it.
const NOW = new Date('2026-08-19T04:30:00Z');
const TODAY = '2026-08-19';
const istDate = (isoUtc: string) => new Date(isoUtc);

const seedRow = (userId: string, over: Record<string, unknown> = {}) =>
  Attendance.create({
    user: userId,
    date: TODAY,
    status: 'absent',
    inTime: null,
    outTime: null,
    workHours: 0,
    isLate: true,
    ...over,
  });

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('attendance auth gate', () => {
  it('401 without a session', async () => {
    const res = await request(app).get('/api/attendance/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid Session.');
  });
});

describe('GET /me', () => {
  it('default absent payload when no cron row exists', async () => {
    const u = await mkPerson('user');
    const res = await request(app).get('/api/attendance/me').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Today Attendance.');
    expect(res.body.data.id).toBe('');
    expect(res.body.data.status).toBe('absent');
    expect(res.body.data.inTime).toBeNull();
    expect(res.body.meta.reason).toBe('cron job not created');
  });

  it('returns the cron-created absent row', async () => {
    const u = await mkPerson('user');
    const row = await seedRow(u.userId);
    const res = await request(app).get('/api/attendance/me').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(String(row._id));
    expect(res.body.data.status).toBe('absent');
  });

  it('recomputes live work hours for an open checked-in record', async () => {
    const u = await mkPerson('user'); // full-time shift
    await seedRow(u.userId, { inTime: istDate('2026-08-19T03:35:00Z'), status: 'present' });
    const res = await request(app).get('/api/attendance/me').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    // in 09:05 IST clamped to itself; out = now 10:00 IST -> 0.917h (+grace < half) -> absent
    expect(res.body.data.workHours).toBe(0.917);
    expect(res.body.data.status).toBe('absent');
  });

  it('caches the response under the per-user today key', async () => {
    const u = await mkPerson('user');
    await request(app).get('/api/attendance/me').set('Cookie', u.cookie);
    expect(redisState.kv.has(`saher:attendance:today:me:${u.userId}`)).toBe(true);
  });
});

describe('GET /today', () => {
  it('rejects plain users', async () => {
    const u = await mkPerson('user');
    const res = await request(app).get('/api/attendance/today').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only Admins And Managers Are Permitted.');
  });

  it('empty day message for admins', async () => {
    const a = await mkPerson('admin');
    const res = await request(app).get('/api/attendance/today').set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Today Is Not A Working Day.');
    expect(res.body.data).toBeNull();
  });

  it('lists today records with pagination meta', async () => {
    const a = await mkPerson('admin');
    const b = await mkPerson('user');
    await seedRow(a.userId);
    await seedRow(b.userId, { inTime: istDate('2026-08-19T03:35:00Z'), status: 'present' });
    const res = await request(app).get('/api/attendance/today').set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Today Attendance.');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.count).toBe(2);
  });

  it('caches the paginated list', async () => {
    const a = await mkPerson('admin');
    await seedRow(a.userId);
    await request(app).get('/api/attendance/today').set('Cookie', a.cookie);
    expect(redisState.kv.has('saher:attendance:today:10:1')).toBe(true);
  });
});

describe('POST /check-in', () => {
  it('fails when no cron row exists', async () => {
    const u = await mkPerson('user');
    const res = await request(app).post('/api/attendance/check-in').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Already Checked In Today Or No Attendance Row Exists.');
  });

  it('fails without an account profile', async () => {
    const u = await mkUserOnly();
    await seedRow(String(u._id));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: (u as unknown as { email: string }).email, password: 'Password123!' });
    expect(res.status).toBe(200);
    const checkin = await request(app)
      .post('/api/attendance/check-in')
      .set('Cookie', cookieOf(res));
    expect(checkin.status).toBe(400);
    expect(checkin.body.message).toBe('Account Not Found .');
  });

  it('marks present on time (not late)', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId);
    const res = await request(app).post('/api/attendance/check-in').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('You Have Been Marked Present.');
    const row = await Attendance.findOne({ user: u.userId, date: TODAY }).lean();
    expect(row?.inTime).not.toBeNull();
    expect(row?.status).toBe('present');
    expect(row?.isLate).toBe(false); // exactly at the 09:00+1h grace boundary
  });

  it('flags late check-ins past grace', async () => {
    vi.setSystemTime(new Date('2026-08-19T05:45:00Z')); // 11:15 IST — before login so the JWT stays valid
    const u = await mkPerson('user');
    await seedRow(u.userId);
    await request(app).post('/api/attendance/check-in').set('Cookie', u.cookie);
    const row = await Attendance.findOne({ user: u.userId, date: TODAY }).lean();
    expect(row?.isLate).toBe(true);
  });

  it('blocks double check-in', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId);
    await request(app).post('/api/attendance/check-in').set('Cookie', u.cookie);
    const res = await request(app).post('/api/attendance/check-in').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You Have Already Check In Today.');
  });
});

describe('POST /check-out', () => {
  it('fails when not checked in', async () => {
    const u = await mkPerson('user');
    const res = await request(app).post('/api/attendance/check-out').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You Have Not Checked In Today Or Already Checked Out.');
  });

  it('computes half-day-range hours and absent status below threshold', async () => {
    vi.setSystemTime(new Date('2026-08-19T07:00:00Z')); // 12:30 IST
    const u = await mkPerson('user');
    await seedRow(u.userId, { inTime: istDate('2026-08-19T03:30:00Z'), status: 'present' }); // 09:00 IST
    const res = await request(app).post('/api/attendance/check-out').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Checked Out Successfully.');
    const row = await Attendance.findOne({ user: u.userId, date: TODAY }).lean();
    expect(row?.workHours).toBe(3.5); // clamped 09:00->12:30
    expect(row?.status).toBe('half-day'); // 3.5 + 1 grace >= 4 half threshold
  });

  it('presents a full-ish day above threshold', async () => {
    vi.setSystemTime(new Date('2026-08-19T12:00:00Z')); // 17:30 IST
    const u = await mkPerson('user');
    await seedRow(u.userId, { inTime: istDate('2026-08-19T03:30:00Z'), status: 'present' });
    await request(app).post('/api/attendance/check-out').set('Cookie', u.cookie);
    const row = await Attendance.findOne({ user: u.userId, date: TODAY }).lean();
    expect(row?.workHours).toBe(8.5);
    expect(row?.status).toBe('present'); // 8.5 + 1 >= 8
  });

  it('blocks double check-out', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId, { inTime: istDate('2026-08-19T03:30:00Z'), status: 'present' });
    await request(app).post('/api/attendance/check-out').set('Cookie', u.cookie);
    const res = await request(app).post('/api/attendance/check-out').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You Have Not Checked In Today Or Already Checked Out.');
  });
});

describe('POST /overtime/check-in', () => {
  it('refuses on a normal working day', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId);
    const res = await request(app).post('/api/attendance/overtime/check-in').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Today Is A Working Day For You.');
  });

  it('converts a week-off into an overtime presence', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId, { status: 'week-off' });
    const res = await request(app).post('/api/attendance/overtime/check-in').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('You Have Been Marked Present.');
    const row = await Attendance.findOne({ user: u.userId, date: TODAY }).lean();
    expect(row?.overtime).toBe(true);
    expect(row?.status).toBe('present');
    expect(row?.isLate).toBe(false);
    expect(row?.inTime).not.toBeNull();
  });
});

describe('POST /weekoff (flexible claim)', () => {
  it('rejects future dates', async () => {
    const u = await mkPerson('user');
    const res = await request(app)
      .post('/api/attendance/weekoff')
      .set('Cookie', u.cookie)
      .send({ date: '2027-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Future Dates Cannot Be Selected.');
  });

  it('404s when no record exists for the date', async () => {
    const u = await mkPerson('user');
    const res = await request(app)
      .post('/api/attendance/weekoff')
      .set('Cookie', u.cookie)
      .send({ date: '2026-08-18' });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Attendance Record Not Found.');
  });

  it('refuses converting a worked day', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId, { inTime: istDate('2026-08-19T03:30:00Z'), status: 'present' });
    const res = await request(app).post('/api/attendance/weekoff').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Present Day Cannot Be Converted To Week Off.');
  });

  it('refuses an already week-off day', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId, { status: 'week-off' });
    const res = await request(app).post('/api/attendance/weekoff').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Already Marked As Week Off.');
  });

  it('caps flexible week offs at two per week', async () => {
    const u = await mkPerson('user');
    await Attendance.create([
      { user: u.userId, date: '2026-08-17', status: 'week-off' }, // Mon
      { user: u.userId, date: '2026-08-18', status: 'week-off' }, // Tue
    ]);
    const res = await request(app).post('/api/attendance/weekoff').set('Cookie', u.cookie);
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Flexible Week Off Already Used For This Week.');
  });

  it('claims an absent day as flexible week off', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId);
    const res = await request(app).post('/api/attendance/weekoff').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Flexible Week Off Claimed Successfully.');
    expect(res.body.data.status).toBe('week-off');
    const row = await Attendance.findOne({ user: u.userId, date: TODAY }).lean();
    expect(row?.status).toBe('week-off');
  });
});

describe('PATCH / (admin mark override)', () => {
  const patchBody = (userId: string) => ({
    id: userId,
    date: TODAY,
    status: 'half-day',
    isLate: false,
  });

  it('rejects plain users', async () => {
    const u = await mkPerson('user');
    const res = await request(app)
      .patch('/api/attendance/')
      .set('Cookie', u.cookie)
      .send(patchBody(u.userId));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only Admins And Manager Are Permitted.');
  });

  it('404-style failure when the record is missing', async () => {
    const a = await mkPerson('admin');
    const other = await mkPerson('user');
    const res = await request(app)
      .patch('/api/attendance/')
      .set('Cookie', a.cookie)
      .send(patchBody(other.userId));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('The Attendance For  User On The Given Date Not Found.');
  });

  it('updates status and isLate', async () => {
    const a = await mkPerson('admin');
    const u = await mkPerson('user');
    await seedRow(u.userId);
    const res = await request(app)
      .patch('/api/attendance/')
      .set('Cookie', a.cookie)
      .send(patchBody(u.userId));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('The Data Has Been Update.');
    expect(res.body.data.status).toBe('half-day');
    const row = await Attendance.findOne({ user: u.userId, date: TODAY }).lean();
    expect(row?.status).toBe('half-day');
    expect(row?.isLate).toBe(false);
  });
});

describe('POST /cron/create/:pass', () => {
  it('creates rows for all users honoring approved leave', async () => {
    const a = await mkPerson('admin');
    const b = await mkPerson('user');
    await Leave.create({
      user: b.userId,
      type: new Types.ObjectId(),
      startDate: istDate('2026-08-18T00:00:00Z'),
      endDate: istDate('2026-08-20T23:59:59Z'),
      totalDays: 3,
      reason: 'family event',
      status: 'approved',
    });
    const res = await request(app).post('/api/attendance/cron/create/x').set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Attendance Created Successfully.');
    expect(res.body.data).toEqual({ total: 2, create: 2, skip: 0 });
    const rowA = await Attendance.findOne({ user: a.userId }).lean();
    const rowB = await Attendance.findOne({ user: b.userId }).lean();
    expect(rowA?.status).toBe('absent');
    expect(rowB?.status).toBe('on-leave');
  });

  it('is idempotent on rerun', async () => {
    const a = await mkPerson('admin');
    await request(app).post('/api/attendance/cron/create/x').set('Cookie', a.cookie);
    const res = await request(app).post('/api/attendance/cron/create/x').set('Cookie', a.cookie);
    expect(res.body.data).toEqual({ total: 1, create: 0, skip: 1 });
  });
});

describe('POST /cron/auto-checkout/:pass', () => {
  it('reports zero updates with nothing pending', async () => {
    const a = await mkPerson('admin');
    const res = await request(app)
      .post('/api/attendance/cron/auto-checkout/x')
      .set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('No Pending Auto Checkouts.');
    expect(res.body.data.updated).toBe(0);
  });

  it('auto checks out open records at shift end', async () => {
    vi.setSystemTime(new Date('2026-08-19T13:00:00Z')); // 18:30 IST — past shift end, pre-login
    const a = await mkPerson('admin');
    const u = await mkPerson('user');
    await seedRow(u.userId, { inTime: istDate('2026-08-19T01:00:00Z'), status: 'present' }); // 06:30 IST
    const res = await request(app)
      .post('/api/attendance/cron/auto-checkout/x')
      .set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Auto Checkout Completed Successfully.');
    expect(res.body.data.updated).toBe(1);
    const row = await Attendance.findOne({ user: u.userId }).lean();
    expect((row?.outTime as Date).toISOString()).toBe('2026-08-19T12:30:00.000Z'); // 18:00 IST
    expect(row?.autoCheckout).toBe(true);
    expect(row?.workHours).toBe(9);
    expect(row?.status).toBe('present');
  });
});

describe('holidays CRUD', () => {
  const holidayBody = { title: 'Diwali', type: 'public-holiday', date: '2026-11-08' };

  it('lists empty', async () => {
    const u = await mkPerson('user');
    const res = await request(app).get('/api/attendance/holiday').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('All Holidays Retrive Successful.');
    expect(res.body.data).toEqual([]);
  });

  it('creates as admin', async () => {
    const a = await mkPerson('admin');
    const res = await request(app)
      .post('/api/attendance/holiday')
      .set('Cookie', a.cookie)
      .send(holidayBody);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('The Holiday Record Has Been Added Successful.');
  });

  it('blocks duplicate date+type', async () => {
    const a = await mkPerson('admin');
    await Holiday.create(holidayBody);
    const res = await request(app)
      .post('/api/attendance/holiday')
      .set('Cookie', a.cookie)
      .send(holidayBody);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Already Been Created');
  });

  it('denies write to plain users', async () => {
    const u = await mkPerson('user');
    const res = await request(app)
      .post('/api/attendance/holiday')
      .set('Cookie', u.cookie)
      .send(holidayBody);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You Do Not Have Permission To Write This Holiday.');
  });

  it('gets one and 404s unknown ids', async () => {
    const u = await mkPerson('user');
    const h = await Holiday.create(holidayBody);
    const ok = await request(app)
      .get(`/api/attendance/holiday/${h._id}`)
      .set('Cookie', u.cookie);
    expect(ok.status).toBe(200);
    expect(ok.body.data.title).toBe('Diwali');

    const miss = await request(app)
      .get(`/api/attendance/holiday/${new Types.ObjectId()}`)
      .set('Cookie', u.cookie);
    expect(miss.status).toBe(404);
    expect(miss.body.message).toBe('Holiday Record Not Found.');
  });

  it('updates as admin', async () => {
    const a = await mkPerson('admin');
    const h = await Holiday.create(holidayBody);
    const res = await request(app)
      .put(`/api/attendance/holiday/${h._id}`)
      .set('Cookie', a.cookie)
      .send({ title: 'Deepavali' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Holiday Record Updated Successful.');
    const fresh = await Holiday.findById(h._id).lean();
    expect(fresh?.title).toBe('Deepavali');
  });

  it('deletes as admin and 404s repeats', async () => {
    const a = await mkPerson('admin');
    const h = await Holiday.create(holidayBody);
    const del = await request(app)
      .delete(`/api/attendance/holiday/${h._id}`)
      .set('Cookie', a.cookie);
    expect(del.status).toBe(200);
    expect(del.body.message).toBe('The Holiday Has Been Deleted Successful.');
    const again = await request(app)
      .delete(`/api/attendance/holiday/${h._id}`)
      .set('Cookie', a.cookie);
    expect(again.status).toBe(404);

    // restore round-trip
    const restore = await request(app)
      .patch(`/api/attendance/holiday/${h._id}/restore`)
      .set('Cookie', a.cookie);
    expect(restore.status).toBe(200);
    expect((await Holiday.findById(h._id).lean())?.isDeleted).toBe(false);

    // restored holiday is readable again
    const back = await request(app)
      .get(`/api/attendance/holiday/${h._id}`)
      .set('Cookie', a.cookie);
    expect(back.status).toBe(200);

    // restoring a live record → 404
    const onceMore = await request(app)
      .patch(`/api/attendance/holiday/${h._id}/restore`)
      .set('Cookie', a.cookie);
    expect(onceMore.status).toBe(404);
  });
});

describe('attendance corrections', () => {
  const correctionBody = (attendanceId: string) => ({
    attendanceId,
    message: 'Forgot to check out, gateway went down',
    inTime: '2026-08-19T03:30:00Z',
    outTime: '2026-08-19T12:30:00Z',
  });

  async function mkCorrectionScenario() {
    const employee = await mkPerson('user');
    const admin = await mkPerson('admin');
    const row = await seedRow(employee.userId);
    return { employee, admin, row };
  }

  it('validates the attendance id shape', async () => {
    const { employee } = await mkCorrectionScenario();
    const res = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send({ ...correctionBody('not-an-oid'), attendanceId: 'not-an-oid' });
    expect(res.status).toBe(400);
  });

  it('404s unknown attendance ids', async () => {
    const { employee } = await mkCorrectionScenario();
    const res = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(new Types.ObjectId())));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User Attendance Not Found.');
  });

  it('forbids correcting someone else’s attendance', async () => {
    const { employee, admin } = await mkCorrectionScenario();
    const adminRow = await seedRow(admin.userId);
    const res = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(adminRow._id)));
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden: You Cannot Correct Others Attendance.');
  });

  it('creates a pending request and notifies admin+manager roles', async () => {
    const { employee, row } = await mkCorrectionScenario();
    const res = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(row._id)));
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Attendance Correction Request Successful.');
    expect(res.body.data.status).toBe('pending');
    // each login writes a 'User Login' notification too — count only role-scoped ones
    const notes = await Notification.countDocuments({ scope: { $in: ['admin', 'manager'] } });
    expect(notes).toBeGreaterThanOrEqual(1);
    expect(
      await Notification.exists({ scope: 'admin', title: 'Receieved New Attendance Correction Request.' }),
    ).toBeTruthy();
  });

  it('blocks a second pending request for the same attendance', async () => {
    const { employee, row } = await mkCorrectionScenario();
    await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(row._id)));
    const res = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(row._id)));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('A Request Already Under Process Of This Date.');
  });

  it('lists own requests via /me', async () => {
    const { employee, row } = await mkCorrectionScenario();
    await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(row._id)));
    const res = await request(app)
      .get('/api/attendance/correction/me')
      .set('Cookie', employee.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Attendance Correction Retrieve Successful.');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].message).toBe('Forgot to check out, gateway went down');
  });

  it("forbids listing another user's corrections as a plain user", async () => {
    const { employee, admin } = await mkCorrectionScenario();
    const res = await request(app)
      .get(`/api/attendance/correction/${admin.userId}`)
      .set('Cookie', employee.cookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden: Action Not Allowed.');
  });

  it('forbids self-handling', async () => {
    // plain users never reach the controller (authorize blocks first), so use an admin requester
    const admin = await mkPerson('admin');
    const adminRow = await seedRow(admin.userId);
    const created = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', admin.cookie)
      .send(correctionBody(String(adminRow._id)));
    expect(created.status).toBe(201);
    const res = await request(app)
      .put(`/api/attendance/correction/${created.body.data._id ?? created.body.data.id}`)
      .set('Cookie', admin.cookie)
      .send({ status: 'approve' });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'Forbidden: You Cannot Approve Or Reject Your Own Correction Request.',
    );
  });

  it('denies handling to roles without update permission', async () => {
    const { employee, row } = await mkCorrectionScenario();
    const bystander = await mkPerson('user');
    const created = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(row._id)));
    const res = await request(app)
      .put(`/api/attendance/correction/${created.body.data._id ?? created.body.data.id}`)
      .set('Cookie', bystander.cookie)
      .send({ status: 'reject' });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You Do Not Have Permission To Update This Attendance-correction.');
  });

  it('rejects with a default reason', async () => {
    const { employee, admin, row } = await mkCorrectionScenario();
    const created = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(row._id)));
    const res = await request(app)
      .put(`/api/attendance/correction/${created.body.data._id ?? created.body.data.id}`)
      .set('Cookie', admin.cookie)
      .send({ status: 'reject' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Attendance Correction Has Been Rejected.');
    const doc = await AttendanceCorrection.findById(created.body.data._id ?? created.body.data.id);
    expect(doc?.status).toBe('reject');
    expect(doc?.reason).toBe('Attendance Correction Has Been Rejected.');
    expect(String(doc?.manager)).toBe(admin.userId);
  });

  it('approves and applies recalculated changes to the attendance row', async () => {
    const { employee, admin, row } = await mkCorrectionScenario();
    const created = await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(row._id)));
    const id = created.body.data._id ?? created.body.data.id;
    const res = await request(app)
      .put(`/api/attendance/correction/${id}`)
      .set('Cookie', admin.cookie)
      .send({ status: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Attendance Correction Approve.');
    const updated = await Attendance.findById(row._id).lean();
    // requested window 09:00–18:00 IST -> 9h, present, on time
    expect(updated?.status).toBe('present');
    expect(updated?.workHours).toBe(9);
    expect(updated?.isLate).toBe(false);
    const doc = await AttendanceCorrection.findById(id);
    expect(doc?.status).toBe('approve');
    expect(doc?.manager).toBeDefined();
  });

  it('admins can list all correction requests', async () => {
    const { employee, admin, row } = await mkCorrectionScenario();
    await request(app)
      .post('/api/attendance/correction')
      .set('Cookie', employee.cookie)
      .send(correctionBody(String(row._id)));
    const res = await request(app)
      .get('/api/attendance/admin/correction')
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('record retrieval', () => {
  it('returns one attendance record', async () => {
    const u = await mkPerson('user');
    const row = await seedRow(u.userId);
    const a = await mkPerson('admin');
    const res = await request(app)
      .get(`/api/attendance/record/${row._id}`)
      .set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Attendance Retrieve Successful.');
    expect(res.body.data.id).toBe(String(row._id));
  });

  it('404s unknown records', async () => {
    const a = await mkPerson('admin');
    const res = await request(app)
      .get(`/api/attendance/record/${new Types.ObjectId()}`)
      .set('Cookie', a.cookie);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Attendance Not Found.');
  });
});

describe('GET /user/:id (all attendance)', () => {
  it('returns own history via me', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId);
    await seedRow(u.userId, { date: '2026-08-18', status: 'week-off' });
    const res = await request(app).get('/api/attendance/user/me').set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('All Attendance .');
    expect(res.body.data).toHaveLength(2);
  });

  it('forbids plain users reading others', async () => {
    const u = await mkPerson('user');
    const other = await mkPerson('user');
    const res = await request(app)
      .get(`/api/attendance/user/${other.userId}`)
      .set('Cookie', u.cookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden.');
  });

  it('lets admins read others', async () => {
    const a = await mkPerson('admin');
    const u = await mkPerson('user');
    await seedRow(u.userId);
    const res = await request(app)
      .get(`/api/attendance/user/${u.userId}`)
      .set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /retrieve/:id (ranged retrieval)', () => {
  it('demands either a type or a date range', async () => {
    const u = await mkPerson('user');
    const res = await request(app).get('/api/attendance/retrieve/me').set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Either You Give The Type Of Retriving Or You Give Both Start Date And End Date.',
    );
  });

  it('rejects invalid types', async () => {
    const u = await mkPerson('user');
    const res = await request(app)
      .get('/api/attendance/retrieve/me?type=decade')
      .set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Enter A Valid Type For Retrieving Records Like Week , Month , Year.');
  });

  it('rejects inverted ranges', async () => {
    const u = await mkPerson('user');
    const res = await request(app)
      .get(
        '/api/attendance/retrieve/me?startDate=2026-08-19&endDate=2026-08-01',
      )
      .set('Cookie', u.cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('The Dates That You Have Entered Are Invalid Please Check.');
  });

  it('returns ranged own records', async () => {
    const u = await mkPerson('user');
    await seedRow(u.userId);
    await seedRow(u.userId, { date: '2026-08-18', status: 'week-off' });
    const res = await request(app)
      .get('/api/attendance/retrieve/me?type=month')
      .set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.count).toBe(2);
  });

  it('forbids plain users retrieving others', async () => {
    const u = await mkPerson('user');
    const other = await mkPerson('user');
    const res = await request(app)
      .get(`/api/attendance/retrieve/${other.userId}?type=week`)
      .set('Cookie', u.cookie);
    expect(res.status).toBe(403);
  });
});

describe('GET /retrieve (all users)', () => {
  it('requires range params', async () => {
    const a = await mkPerson('admin');
    const res = await request(app).get('/api/attendance/retrieve').set('Cookie', a.cookie);
    expect(res.status).toBe(400);
  });

  it('returns cross-user records in range', async () => {
    const a = await mkPerson('admin');
    const u = await mkPerson('user');
    await seedRow(a.userId);
    await seedRow(u.userId);
    const res = await request(app)
      .get('/api/attendance/retrieve?type=week')
      .set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('The Record You Asked For .');
    expect(res.body.data).toHaveLength(2);
  });
});
