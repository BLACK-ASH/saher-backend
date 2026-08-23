import { Types } from 'mongoose';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../src/app.js';
import { Participant } from '../../src/database/participant.model.js';
import { Program } from '../../src/database/program.model.js';
import { Session } from '../../src/database/session.model.js';
import { Workshop } from '../../src/database/workshop.model.js';
import { mkPerson } from '../helpers/person.js';

// Fixed clock: Wed 2026-08-19 10:00 IST. Session dates are comfortably in the future.
const NOW = new Date('2026-08-19T04:30:00Z');
const FUTURE_DATE = '2026-09-01T00:00:00.000Z';

const sessionBody = (speakerId: string, over: Record<string, unknown> = {}) => ({
  title: 'Intro To Schematics',
  description: 'Hands-on intro',
  date: FUTURE_DATE,
  startTime: '2026-09-01T03:30:00Z',
  endTime: '2026-09-01T06:30:00Z',
  speaker: [speakerId],
  ...over,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('events auth gate', () => {
  it('401 without a session', async () => {
    const res = await request(app).get('/api/events/workshops');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid Session.');
  });

  it('plain users cannot write events', async () => {
    const u = await mkPerson('user');
    const res = await request(app)
      .post('/api/events/programs')
      .set('Cookie', u.cookie)
      .send({ title: 'P', description: 'D' });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You Do Not Have Permission To Write This Event.');
  });
});

describe('workshops', () => {
  it('creates a workshop under a program', async () => {
    const admin = await mkPerson('admin');
    const program = await Program.create({ title: 'Skill', description: 'Desc' });
    const res = await request(app)
      .post(`/api/events/workshops/${program._id}`)
      .set('Cookie', admin.cookie)
      .send({ title: 'Soldering 101', description: '<b>Basics</b>' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Workshop Is Added Successfully.');
  });

  it('404s unknown programs on create', async () => {
    const admin = await mkPerson('admin');
    const res = await request(app)
      .post(`/api/events/workshops/${new Types.ObjectId()}`)
      .set('Cookie', admin.cookie)
      .send({ title: 'X', description: 'Y' });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Program Not Found.');
  });

  it('lists workshops with pagination and keyword filter', async () => {
    const u = await mkPerson('user');
    const program = await Program.create({ title: 'Skill', description: 'Desc' });
    await Workshop.create([
      { title: 'Alpha Workshop', description: 'a', program: program._id },
      { title: 'Beta Session', description: 'b', program: program._id },
    ]);
    const all = await request(app).get('/api/events/workshops').set('Cookie', u.cookie);
    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(2);

    const filtered = await request(app)
      .get('/api/events/workshops?keyword=alpha')
      .set('Cookie', u.cookie);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].title).toBe('Alpha Workshop');
    // keyword matching a program title pulls in its workshops
    const byProgram = await request(app)
      .get('/api/events/workshops?keyword=skill')
      .set('Cookie', u.cookie);
    expect(byProgram.body.data).toHaveLength(2);
  });

  it('gets one workshop with populated program title', async () => {
    const u = await mkPerson('user');
    const program = await Program.create({ title: 'Skill', description: 'Desc' });
    const ws = await Workshop.create({
      title: 'W',
      description: 'D',
      program: program._id,
    });
    const res = await request(app)
      .get(`/api/events/workshops/${ws._id}`)
      .set('Cookie', u.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.program.title).toBe('Skill');
  });

  it('rejects invalid workshop ids', async () => {
    const u = await mkPerson('user');
    const res = await request(app)
      .get('/api/events/workshops/not-an-oid')
      .set('Cookie', u.cookie);
    expect(res.status).toBe(400);
  });

  it('edits a workshop', async () => {
    const admin = await mkPerson('admin');
    const program = await Program.create({ title: 'P', description: 'D' });
    const ws = await Workshop.create({ title: 'Old', description: 'D', program: program._id });
    const res = await request(app)
      .put(`/api/events/workshops/${ws._id}`)
      .set('Cookie', admin.cookie)
      .send({ title: 'New' });
    expect(res.status).toBe(200);
    const fresh = await Workshop.findById(ws._id).lean();
    expect(fresh?.title).toBe('New');
  });

  it('soft deletes and hides from default reads', async () => {
    const admin = await mkPerson('admin');
    const u = await mkPerson('user');
    const program = await Program.create({ title: 'P', description: 'D' });
    const ws = await Workshop.create({ title: 'W', description: 'D', program: program._id });
    const del = await request(app)
      .delete(`/api/events/workshops/${ws._id}`)
      .set('Cookie', admin.cookie);
    expect(del.status).toBe(200);
    expect(del.body.message).toBe('Workshop Has Been Soft Deleted Successfully.');

    const gone = await request(app)
      .get(`/api/events/workshops/${ws._id}`)
      .set('Cookie', u.cookie);
    expect(gone.status).toBe(404);

    // still visible with isDeleted=true
    const trashed = await request(app)
      .get('/api/events/workshops?isDeleted=true')
      .set('Cookie', u.cookie);
    expect(trashed.body.data).toHaveLength(1);
  });

  it('restores a soft-deleted workshop', async () => {
    const admin = await mkPerson('admin');
    const program = await Program.create({ title: 'P', description: 'D' });
    const ws = await Workshop.create({
      title: 'W',
      description: 'D',
      program: program._id,
      isDeleted: true,
    });
    const res = await request(app)
      .patch(`/api/events/workshops/restore/${ws._id}`)
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    const fresh = await Workshop.findById(ws._id).lean();
    expect(fresh?.isDeleted).toBe(false);
  });
});

describe('sessions', () => {
  async function mkProgramWithSpeaker() {
    const admin = await mkPerson('admin');
    const speaker = await mkPerson('user');
    const program = await Program.create({ title: 'Camp', description: 'Annual camp' });
    return { admin, speaker, program };
  }

  it('creates a session linked to an existing workshop', async () => {
    const { admin, speaker, program } = await mkProgramWithSpeaker();
    const ws = await Workshop.create({ title: 'W', description: 'D', program: program._id });
    const res = await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(sessionBody(speaker.userId, { workshop: String(ws._id) }));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Session Created Successfully.');
    const doc = await Session.findOne({ program: program._id }).lean();
    expect(String(doc?.workshop)).toBe(String(ws._id));
  });

  it('auto-creates a workshop when none is supplied', async () => {
    const { admin, speaker, program } = await mkProgramWithSpeaker();
    const res = await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(sessionBody(speaker.userId));
    expect(res.status).toBe(200);
    const doc = await Session.findOne().lean();
    expect(doc?.workshop).toBeTruthy();
    const ws = await Workshop.findById(doc?.workshop).lean();
    expect(ws?.title).toBe('Intro To Schematics');
  });

  it('rejects a workshop belonging to another program', async () => {
    const { admin, speaker, program } = await mkProgramWithSpeaker();
    const other = await Program.create({ title: 'Other', description: 'D' });
    const ws = await Workshop.create({ title: 'Foreign', description: 'D', program: other._id });
    const res = await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(sessionBody(speaker.userId, { workshop: String(ws._id) }));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Workshop Not Found.');
  });

  it('validates date/time ordering and past dates', async () => {
    const { admin, speaker, program } = await mkProgramWithSpeaker();
    const badOrder = await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(
        sessionBody(speaker.userId, {
          startTime: '2026-09-01T06:30:00Z',
          endTime: '2026-09-01T03:30:00Z',
        }),
      );
    expect(badOrder.status).toBe(400);

    const past = await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(
        sessionBody(speaker.userId, {
          date: '2020-01-01T00:00:00Z',
          startTime: '2020-01-01T03:30:00Z',
          endTime: '2020-01-01T06:30:00Z',
        }),
      );
    expect(past.status).toBe(400);
  });

  it('lists and fetches single sessions', async () => {
    const { admin, speaker, program } = await mkProgramWithSpeaker();
    await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(sessionBody(speaker.userId));
    const list = await request(app)
      .get('/api/events/sessions?keyword=schematics')
      .set('Cookie', admin.cookie);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const doc = await Session.findOne().lean();
    const single = await request(app)
      .get(`/api/events/sessions/${doc?._id}`)
      .set('Cookie', admin.cookie);
    expect(single.status).toBe(200);
    expect(single.body.data.speaker[0].id).toBe(speaker.userId);
    expect(single.body.data.program.title).toBe('Camp');
  });

  it('notifies the speaker on creation', async () => {
    const { admin, speaker, program } = await mkProgramWithSpeaker();
    await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(sessionBody(speaker.userId));
    const notes = await import('../../src/database/notification.model.js').then((m) =>
      m.Notification.find({ user: speaker.userId }).lean(),
    );
    expect(notes.some((n) => n.title.includes('Session Assigned'))).toBe(true);
  });

  it('edits a session and invalidates the calendar cache', async () => {
    const { admin, speaker, program } = await mkProgramWithSpeaker();
    await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(sessionBody(speaker.userId));
    const doc = await Session.findOne().lean();
    // seed the calendar cache then confirm the edit wipes it
    const { redisState } = await import('../helpers/fake-redis.js');
    redisState.kv.set('saher:calendar:2026:8', '{"x":1}');
    const res = await request(app)
      .put(`/api/events/sessions/${doc?._id}`)
      .set('Cookie', admin.cookie)
      .send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(redisState.kv.has('saher:calendar:2026:8')).toBe(false);
  });

  it('deletes and restores sessions', async () => {
    const { admin, speaker, program } = await mkProgramWithSpeaker();
    await request(app)
      .post(`/api/events/sessions/${program._id}`)
      .set('Cookie', admin.cookie)
      .send(sessionBody(speaker.userId));
    const doc = await Session.findOne().lean();

    const del = await request(app)
      .delete(`/api/events/sessions/${doc?._id}`)
      .set('Cookie', admin.cookie);
    expect(del.status).toBe(200);
    expect(del.body.message).toBe('Session Has Been Deleted Successfully.');

    const restore = await request(app)
      .patch(`/api/events/sessions/restore/${doc?._id}`)
      .set('Cookie', admin.cookie);
    expect(restore.status).toBe(200);
    const fresh = await Session.findById(doc?._id).lean();
    expect(fresh?.isDeleted).toBe(false);
  });
});

describe('participants', () => {
  const body = {
    name: 'Ravi Kumar',
    age: 30,
    phoneNumber: '+91 9876543210',
  };

  it('creates a participant with normalized phone', async () => {
    const admin = await mkPerson('admin');
    const res = await request(app)
      .post('/api/events/participants')
      .set('Cookie', admin.cookie)
      .send(body);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Participant Added Successfully.');
    const doc = await Participant.findOne().lean();
    expect(doc?.phoneNumber).toBe('9876543210');
  });

  it('rejects digits in names', async () => {
    const admin = await mkPerson('admin');
    const res = await request(app)
      .post('/api/events/participants')
      .set('Cookie', admin.cookie)
      .send({ ...body, name: 'R4vi' });
    expect(res.status).toBe(400);
  });

  it('requires parentDetails for minors', async () => {
    const admin = await mkPerson('admin');
    const res = await request(app)
      .post('/api/events/participants')
      .set('Cookie', admin.cookie)
      .send({ name: 'Kid Name', age: 12 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('Parent Details');
  });

  it('lists, gets, edits participants', async () => {
    const admin = await mkPerson('admin');
    const p = await Participant.create({ name: 'List Me', age: 44 });

    const list = await request(app).get('/api/events/participants').set('Cookie', admin.cookie);
    expect(list.body.data).toHaveLength(1);

    const one = await request(app)
      .get(`/api/events/participants/${p._id}`)
      .set('Cookie', admin.cookie);
    expect(one.status).toBe(200);
    expect(one.body.data.id).toBe(String(p._id));

    const edit = await request(app)
      .put(`/api/events/participants/${p._id}`)
      .set('Cookie', admin.cookie)
      .send({ age: 45 });
    expect(edit.status).toBe(200);
    const fresh = await Participant.findById(p._id).lean();
    expect(fresh?.age).toBe(45);
  });

  it('soft deletes and restores participants', async () => {
    const admin = await mkPerson('admin');
    const p = await Participant.create({ name: 'Del Me', age: 20 });
    const del = await request(app)
      .delete(`/api/events/participants/${p._id}`)
      .set('Cookie', admin.cookie);
    expect(del.status).toBe(200);

    const restore = await request(app)
      .patch(`/api/events/participants/restore/${p._id}`)
      .set('Cookie', admin.cookie);
    expect(restore.status).toBe(201);
    const fresh = await Participant.findById(p._id).lean();
    expect(fresh?.isDeleted).toBe(false);
  });
});

describe('programs', () => {
  it('creates a program', async () => {
    const admin = await mkPerson('admin');
    const res = await request(app)
      .post('/api/events/programs')
      .set('Cookie', admin.cookie)
      .send({ title: 'Summer Camp', description: '<i>Fun</i>' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Program Has Been Added Successfully.');
  });

  it('validates participant ids on create', async () => {
    const admin = await mkPerson('admin');
    const res = await request(app)
      .post('/api/events/programs')
      .set('Cookie', admin.cookie)
      .send({
        title: 'P',
        description: 'D',
        participants: [String(new Types.ObjectId())],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('One Or More Participant Ids Are Invalid.');
  });

  it('lists programs with keyword search', async () => {
    const admin = await mkPerson('admin');
    await Program.create([
      { title: 'Chess Camp', description: 'strategy' },
      { title: 'Art Camp', description: 'painting' },
    ]);
    const all = await request(app).get('/api/events/programs').set('Cookie', admin.cookie);
    expect(all.body.data).toHaveLength(2);
    const hit = await request(app)
      .get('/api/events/programs?keyword=chess')
      .set('Cookie', admin.cookie);
    expect(hit.body.data).toHaveLength(1);
    expect(hit.body.data[0].title).toBe('Chess Camp');
  });

  it('gets one program with hydrated participants', async () => {
    const admin = await mkPerson('admin');
    const p = await Participant.create({ name: 'Camper One', age: 22 });
    const program = await Program.create({
      title: 'Camp',
      description: 'D',
      participants: [p._id],
    });
    const res = await request(app)
      .get(`/api/events/programs/${program._id}`)
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.participants[0].name).toBe('Camper One');
  });

  it('edits and soft deletes programs', async () => {
    const admin = await mkPerson('admin');
    const program = await Program.create({ title: 'Old', description: 'D' });

    const edit = await request(app)
      .put(`/api/events/programs/${program._id}`)
      .set('Cookie', admin.cookie)
      .send({ title: 'New' });
    expect(edit.status).toBe(200);

    const del = await request(app)
      .delete(`/api/events/programs/${program._id}`)
      .set('Cookie', admin.cookie);
    expect(del.status).toBe(200);

    const gone = await request(app)
      .get(`/api/events/programs/${program._id}`)
      .set('Cookie', admin.cookie);
    expect(gone.status).toBe(404);
  });

  it('manages program membership', async () => {
    const admin = await mkPerson('admin');
    const program = await Program.create({ title: 'P', description: 'D' });
    const [a, b] = await Participant.create([
      { name: 'Member A', age: 30 },
      { name: 'Late B', age: 31 },
    ]);

    const add = await request(app)
      .post(`/api/events/programs/participants/${program._id}`)
      .set('Cookie', admin.cookie)
      .send({ participantIds: [String(a._id), String(b._id)] });
    expect(add.status).toBe(200);
    expect(add.body.message).toBe('Participants Added Successfully.');

    const list = await request(app)
      .get(`/api/events/programs/participants/${program._id}`)
      .set('Cookie', admin.cookie);
    expect(list.body.data).toHaveLength(2);

    const remove = await request(app)
      .delete(`/api/events/programs/participants/${program._id}/${b._id}`)
      .set('Cookie', admin.cookie);
    expect(remove.status).toBe(200);
    const after = await Program.findById(program._id).lean();
    expect(after?.participants).toHaveLength(1);
  });

  it('404s adding nonexistent participants to a program', async () => {
    const admin = await mkPerson('admin');
    const program = await Program.create({ title: 'P', description: 'D' });
    const res = await request(app)
      .post(`/api/events/programs/participants/${program._id}`)
      .set('Cookie', admin.cookie)
      .send({ participantIds: [String(new Types.ObjectId())] });
    expect(res.status).toBe(404);
  });
});

describe('session attendance marking', () => {
  async function mkScenario() {
    const admin = await mkPerson('admin');
    const program = await Program.create({ title: 'P', description: 'D' });
    const ws = await Workshop.create({ title: 'W', description: 'D', program: program._id });
    const members = await Participant.create([
      { name: 'M One', age: 25 },
      { name: 'M Two', age: 26 },
    ]);
    await Program.findByIdAndUpdate(program._id, {
      $set: { participants: members.map((m) => m._id) },
    });
    const session = await Session.create({
      title: 'S',
      description: 'D',
      date: FUTURE_DATE,
      startTime: new Date('2026-09-01T03:30:00Z'),
      endTime: new Date('2026-09-01T06:30:00Z'),
      program: program._id,
      workshop: ws._id,
      speaker: [new Types.ObjectId()],
    });
    return { admin, program, ws, members, session };
  }

  it('marks attendance for enrolled participants', async () => {
    const { admin, members, session } = await mkScenario();
    const res = await request(app)
      .post(`/api/events/attendance/sessions/${session._id}`)
      .set('Cookie', admin.cookie)
      .send({ participantIds: [String(members[0]._id)] });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Attendance Marked Successfully.');
    expect(res.body.data.success).toEqual([String(members[0]._id)]);
    const doc = await Session.findById(session._id).lean();
    expect(doc?.participants).toHaveLength(1);
  });

  it('reports unknown participants as failures', async () => {
    const { admin, session } = await mkScenario();
    const ghost = String(new Types.ObjectId());
    const res = await request(app)
      .post(`/api/events/attendance/sessions/${session._id}`)
      .set('Cookie', admin.cookie)
      .send({ participantIds: [ghost] });
    expect(res.status).toBe(200);
    expect(res.body.data.failure).toEqual([ghost]);
  });

  it('updates attendance by merging ids', async () => {
    const { admin, members, session } = await mkScenario();
    await Session.findByIdAndUpdate(session._id, { $set: { participants: [members[0]._id] } });
    const res = await request(app)
      .put(`/api/events/attendance/sessions/${session._id}`)
      .set('Cookie', admin.cookie)
      .send({ participantIds: [String(members[1]._id)] });
    expect(res.status).toBe(200);
    const doc = await Session.findById(session._id).lean();
    expect(doc?.participants).toHaveLength(2); // merged, not replaced
  });

  it('removes attendance and rejects non-members', async () => {
    const { admin, members, session } = await mkScenario();
    await Session.findByIdAndUpdate(session._id, { $set: { participants: [members[0]._id] } });

    const ok = await request(app)
      .delete(`/api/events/attendance/sessions/${session._id}`)
      .set('Cookie', admin.cookie)
      .send({ participantIds: [String(members[0]._id)] });
    expect(ok.status).toBe(200);
    expect(ok.body.message).toBe('Participants Remove From Attendance Successfully.');

    const miss = await request(app)
      .delete(`/api/events/attendance/sessions/${session._id}`)
      .set('Cookie', admin.cookie)
      .send({ participantIds: [String(members[1]._id)] });
    expect(miss.status).toBe(404);
  });

  it('sends session reminders to the speaker', async () => {
    const { admin, session } = await mkScenario();
    const speaker = await mkPerson('user');
    await Session.findByIdAndUpdate(session._id, { $set: { speaker: [speaker.userId] } });
    const res = await request(app)
      .get(`/api/events/programs/workshops/sessions/${session._id}`)
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Reminder Notification Sent Successfully.');
    const Notification = await import('../../src/database/notification.model.js').then(
      (m) => m.Notification,
    );
    expect(await Notification.exists({ user: speaker.userId })).toBeTruthy();
  });
});
