import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { mkPerson } from '../helpers/person.js';

describe('GET /api/attendance/export/report', () => {
  it('rejects unknown formats', async () => {
    const u = await mkPerson('user');

    const res = await request(app)
      .get('/api/attendance/export/report')
      .query({ type: 'today', format: 'docx' })
      .set('Cookie', u.cookie);

    expect(res.status).toBe(400);
  });
});
