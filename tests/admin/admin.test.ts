import { compare } from 'bcrypt';
import { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { Account } from '../../src/database/account.model.js';
import { Bank } from '../../src/database/bank.model.js';
import { Media } from '../../src/database/media-upload.model.js';
import { User } from '../../src/database/user.model.js';
import { createFullAccount } from '../helpers/account.js';
import { mkPerson } from '../helpers/person.js';
import type { Ctx} from '../helpers/person.js';

let admin: Ctx;
let manager: Ctx;
let plain: Ctx;

const mediaIds = async () => {
  const docs = await Media.create([
    { alt: 'img', src: `/uploads/${new Types.ObjectId()}.webp` },
    { alt: 'aadhar', src: `/uploads/${new Types.ObjectId()}.webp` },
    { alt: 'pan', src: `/uploads/${new Types.ObjectId()}.webp` },
    { alt: 'resume', src: `/uploads/${new Types.ObjectId()}.webp` },
  ]);
  return docs.map((d) => String(d._id));
};

const registrationBody = async (
  overrides: {
    email?: string;
    name?: string;
    employeeId?: string;
    employeeType?: string;
    employeeShift?: string;
  } = {},
) => {
  const [image, aadhar, pan, resume] = await mediaIds();
  const name = overrides.name ?? 'Priya Sharma';
  return {
    user: { name, email: overrides.email ?? `priya-${Date.now()}@test.dev`, image },
    account: {
      dateOfBirth: '1995-06-15',
      dateOfJoining: '2024-02-01',
      phoneNumber: '9876543210',
      employeeId: overrides.employeeId ?? `EMP-${Date.now()}`,
      department: 'ENG',
      designation: 'DEV',
      employeeType: overrides.employeeType ?? 'full-time',
      ...(overrides.employeeShift ? { employeeShift: overrides.employeeShift } : {}),
      salaryStructure: 'L1',
      address: 'MG Road, Bengaluru',
      aadhar,
      pan,
      resume,
    },
    bank: {
      accountHolderName: 'Priya Sharma',
      accountNumber: '1234567890123',
      bankName: 'HDFC',
      ifcs: 'hdfc0001234',
      branch: 'Koramangala',
      mobileNumber: '+91 9876501234',
    },
  };
};

// beforeEach wipes redis (sessions live there) — recreate logins every test
beforeEach(async () => {
  admin = await mkPerson('admin');
  manager = await mkPerson('manager');
  plain = await mkPerson('user');
});

describe('admin module', () => {
  describe('authorization', () => {
    it('rejects unauthenticated access', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
    });

    it('blocks plain users from admin writes', async () => {
      expect((await request(app).post('/api/admin/account').set('Cookie', plain.cookie).send({})).status).toBe(403);
      expect((await request(app).post('/api/admin/bank').set('Cookie', plain.cookie).send({})).status).toBe(403);
      expect(
        (await request(app).put(`/api/admin/user/${plain.userId}`).set('Cookie', plain.cookie).send({})).status,
      ).toBe(403);
      expect((await request(app).get('/api/admin/users').set('Cookie', plain.cookie)).status).toBe(403);
    });

    it('lets managers write but not delete', async () => {
      const del = await request(app).delete(`/api/admin/user/${plain.userId}`).set('Cookie', manager.cookie);
      expect(del.status).toBe(403);

      const bankDel = await request(app).delete('/api/admin/bank/anything').set('Cookie', manager.cookie);
      expect(bankDel.status).toBe(403);
    });
  });

  describe('registration', () => {
    it('registers an employee and issues derived credentials', async () => {
      const body = await registrationBody();
      const res = await request(app)
        .post('/api/admin/account')
        .set('Cookie', admin.cookie)
        .send(body);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Employee Registered.');

      // password = first 4 letters of name uppercased + birth year
      const doc = await User.findOne({ email: body.user.email }).select('password').lean();
      expect(await compare('PRIY1995', doc!.password!)).toBe(true);
    });

    it('normalizes phone numbers and ifcs on save', async () => {
      const body = await registrationBody({ email: `norm-${Date.now()}@test.dev`, employeeId: `N-${Date.now()}` });
      await request(app).post('/api/admin/account').set('Cookie', admin.cookie).send(body);

      const account = await Account.findOne().sort({ createdAt: -1 });
      expect(account?.phoneNumber).toBe('9876543210');
      const bank = await Bank.findById(account?.bank);
      expect(bank?.ifcs).toBe('HDFC0001234');
    });

    it('persists bankName as a string and returns it unaltered on self-read (USER-01)', async () => {
      const body = await registrationBody({ email: `bank-${Date.now()}@test.dev`, employeeId: `BNK-${Date.now()}` });
      const res = await request(app).post('/api/admin/account').set('Cookie', admin.cookie).send(body);
      expect(res.status).toBe(201);

      const account = await Account.findOne({ user: (await User.findOne({ email: body.user.email }).lean())?._id }).lean();
      const bank = await Bank.findById(account?.bank).lean();
      expect(bank?.bankName).toBe('HDFC');
      expect(typeof bank?.bankName).toBe('string');

      // admin registration intentionally creates an unverified user (email flow) —
      // verify directly so we can exercise the self-read path, which is what we assert
      await User.updateOne({ email: body.user.email }, { $set: { emailVerified: true } });
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: body.user.email, password: 'PRIY1995' });
      expect(login.status).toBe(200);

      const self = await request(app)
        .get('/api/user')
        .set('Cookie', login.headers['set-cookie']);
      expect(self.status).toBe(200);
      expect(self.body.data.bank.bankName).toBe('HDFC');
    });

    it('requires employeeShift for part-time employees', async () => {
      const body = await registrationBody({
        email: `part-${Date.now()}@test.dev`,
        employeeId: `PT-${Date.now()}`,
        employeeType: 'part-time',
      });
      const res = await request(app).post('/api/admin/account').set('Cookie', admin.cookie).send(body);
      expect(res.status).toBe(400);
    });

    it('rejects duplicate email and duplicate employeeId', async () => {
      const first = await registrationBody({ email: `dup-${Date.now()}@test.dev`, employeeId: `DUP-${Date.now()}` });
      await request(app).post('/api/admin/account').set('Cookie', admin.cookie).send(first);

      const dupEmail = await registrationBody({ email: first.user.email, employeeId: `X-${Date.now()}` });
      expect((await request(app).post('/api/admin/account').set('Cookie', admin.cookie).send(dupEmail)).status).toBe(400);

      const dupEmp = await registrationBody({ email: `fresh-${Date.now()}@test.dev`, employeeId: first.account.employeeId });
      expect((await request(app).post('/api/admin/account').set('Cookie', admin.cookie).send(dupEmp)).status).toBe(400);
    });
  });

  describe('accounts', () => {
    it('returns own account via /me', async () => {
      const { user } = await createFullAccount({ email: `acct-me-${Date.now()}@test.dev` });
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Password123!' });

      const res = await request(app).get('/api/admin/account/me').set('Cookie', login.headers['set-cookie']);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.bank.accountNumber).toBeTruthy();
    });

    it('admins read any account; plain users cannot', async () => {
      const { account } = await createFullAccount();

      const ok = await request(app).get(`/api/admin/account/${account._id}`).set('Cookie', admin.cookie);
      expect(ok.status).toBe(200);

      const forbidden = await request(app).get(`/api/admin/account/${account._id}`).set('Cookie', plain.cookie);
      expect(forbidden.status).toBe(403);
    });

    it('updates an account and busts the by-user cache', async () => {
      const { user, account } = await createFullAccount();
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Password123!' });
      const cookie = login.headers['set-cookie'];

      // warm the by-userId cache
      await request(app).get('/api/admin/account/me').set('Cookie', cookie);

      const upd = await request(app)
        .put(`/api/admin/account/${account._id}`)
        .set('Cookie', manager.cookie)
        .send({ designation: 'LEAD' });
      expect(upd.status).toBe(200);

      const fresh = await request(app).get('/api/admin/account/me').set('Cookie', cookie);
      expect(fresh.status).toBe(200);
      expect(fresh.body.data.designation).toBe('LEAD');
    });
  });

  describe('bank details', () => {
    it('creates standalone bank details', async () => {
      const res = await request(app).post('/api/admin/bank').set('Cookie', manager.cookie).send({
        accountHolderName: 'Ravi Kumar',
        accountNumber: '999888777666',
        bankName: 'SBI',
        ifcs: 'sbin0012345',
        branch: 'Indiranagar',
        mobileNumber: '9812345678',
      });
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Bank Details Added Successfull.');
      expect(res.body.data.ifcs).toBe('SBIN0012345');
    });

    it('serves own bank via /me and blocks other reads for plain users', async () => {
      const { user, bank } = await createFullAccount();
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Password123!' });
      const cookie = login.headers['set-cookie'];

      const mine = await request(app).get('/api/admin/bank/me').set('Cookie', cookie);
      expect(mine.status).toBe(200);
      expect(String(mine.body.data.id)).toBe(String(bank._id));

      const other = await request(app).get(`/api/admin/bank/${bank._id}`).set('Cookie', plain.cookie);
      expect(other.status).toBe(403);

      const adminRead = await request(app).get(`/api/admin/bank/${bank._id}`).set('Cookie', admin.cookie);
      expect(adminRead.status).toBe(200);
    });

    it('updates bank and propagates into cached account reads', async () => {
      const { user, bank } = await createFullAccount();
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Password123!' });
      const cookie = login.headers['set-cookie'];

      // warm both caches
      await request(app).get('/api/admin/account/me').set('Cookie', cookie);

      const upd = await request(app)
        .put(`/api/admin/bank/${bank._id}`)
        .set('Cookie', manager.cookie)
        .send({ accountHolderName: 'Updated Holder' });
      expect(upd.status).toBe(200);
      expect(upd.body.data.accountHolderName).toBe('Updated Holder');

      const fresh = await request(app).get('/api/admin/account/me').set('Cookie', cookie);
      expect(fresh.body.data.bank.accountHolderName).toBe('Updated Holder');
    });

    it('rejects bank deletion for every role — no role holds delete:bank', async () => {
      const created = await Bank.create({
        accountHolderName: 'Temp',
        accountNumber: '1',
        bankName: 'T',
        ifcs: 'TSTB0000001',
        branch: 'B',
        mobileNumber: '9800000000',
      });
      for (const cookie of [admin.cookie, manager.cookie]) {
        const res = await request(app).delete(`/api/admin/bank/${created._id}`).set('Cookie', cookie);
        expect(res.status).toBe(403);
      }
    });

    it('restores a soft-deleted bank and hides deleted from reads', async () => {
      const soft = await Bank.create({
        accountHolderName: 'Ghost Holder',
        accountNumber: '42',
        bankName: 'Phantom Bank',
        ifcs: 'PHNT0000042',
        branch: 'Nowhere',
        mobileNumber: '9800000042',
        isDeleted: true,
      });

      // deleted bank is invisible on read
      const gone = await request(app).get(`/api/admin/bank/${soft._id}`).set('Cookie', admin.cookie);
      expect(gone.status).toBe(400);

      // restore brings it back (managers hold bank write/update)
      const restore = await request(app)
        .patch(`/api/admin/bank/restore/${soft._id}`)
        .set('Cookie', manager.cookie);
      expect(restore.status).toBe(200);
      expect((await Bank.findById(soft._id).lean())?.isDeleted).toBe(false);

      const back = await request(app).get(`/api/admin/bank/${soft._id}`).set('Cookie', admin.cookie);
      expect(back.status).toBe(200);
    });
  });

  describe('user management', () => {
    it('lists all users for admins', async () => {
      const res = await request(app).get('/api/admin/users').set('Cookie', admin.cookie);
      expect(res.status).toBe(200);
      const emails = res.body.data.map((u: { email: string }) => u.email);
      expect(emails).toContain(admin.email);
      expect(res.body.data[0].password).toBeUndefined();
    });

    it('reads own record via /user/me and others as admin', async () => {
      const me = await request(app).get('/api/admin/user/me').set('Cookie', plain.cookie);
      expect(me.status).toBe(200);
      expect(String(me.body.data.user.id)).toBe(plain.userId);

      const other = await request(app).get(`/api/admin/user/${plain.userId}`).set('Cookie', admin.cookie);
      expect(other.status).toBe(200);

      const forbidden = await request(app).get(`/api/admin/user/${admin.userId}`).set('Cookie', plain.cookie);
      expect(forbidden.status).toBe(403);

      const missing = await request(app)
        .get(`/api/admin/user/${new Types.ObjectId()}`)
        .set('Cookie', admin.cookie);
      expect(missing.status).toBe(404);
    });

    it('updates profile fields and hashes supplied passwords', async () => {
      const { user } = await createFullAccount();

      const upd = await request(app)
        .put(`/api/admin/user/${user._id}`)
        .set('Cookie', admin.cookie)
        .send({ displayName: 'Renamed Person', password: 'BrandNew#99' });
      expect(upd.status).toBe(200);

      const doc = await User.findById(user._id).select('displayName password').lean();
      expect(doc?.displayName).toBe('Renamed Person');
      expect(doc?.password).not.toBe('BrandNew#99');
      expect(await compare('BrandNew#99', doc!.password!)).toBe(true);
    });

    it('prevents self-deletion', async () => {
      const res = await request(app).delete(`/api/admin/user/${admin.userId}`).set('Cookie', admin.cookie);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You Cannot Delete Yourself.');
    });

    it('soft-deletes active users then restores them', async () => {
      const { user } = await createFullAccount();

      const del = await request(app).delete(`/api/admin/user/${user._id}`).set('Cookie', admin.cookie);
      expect(del.status).toBe(200);

      const soft = await User.findById(user._id).lean();
      expect(soft?.isActive).toBe(false);
      expect(soft?.deletedAt).toBeTruthy();

      const restore = await request(app).patch(`/api/admin/user/${user._id}/restore`).set('Cookie', admin.cookie);
      expect(restore.status).toBe(200);
      expect((await User.findById(user._id))?.isActive).toBe(true);

      const notDeleted = await request(app)
        .patch(`/api/admin/user/${user._id}/restore`)
        .set('Cookie', admin.cookie);
      expect(notDeleted.status).toBe(400);
    });

    it('never hard-deletes already-inactive users — repeat delete 404s, record survives', async () => {
      const { user } = await createFullAccount();
      await User.findByIdAndUpdate(user._id, { isActive: false, deletedAt: new Date() });

      // repeat delete of an already-soft-deleted user → 404 (events convention)
      const del = await request(app).delete(`/api/admin/user/${user._id}`).set('Cookie', admin.cookie);
      expect(del.status).toBe(404);

      // record still exists — no permanent-delete path
      expect(await User.findById(user._id)).not.toBeNull();

      // and it remains restorable
      const restore = await request(app).patch(`/api/admin/user/${user._id}/restore`).set('Cookie', admin.cookie);
      expect(restore.status).toBe(200);
      expect((await User.findById(user._id))?.isActive).toBe(true);
    });
  });
});
