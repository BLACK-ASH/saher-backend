import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { Media } from '../../src/database/media-upload.model.js';
import type { Ctx } from '../helpers/person.js';
import { mkPerson } from '../helpers/person.js';

let person: Ctx;

beforeEach(async () => {
  person = await mkPerson('user');
});

describe('document upload', () => {
  it('accepts a valid pdf upload and stores it under /uploads/documents/', async () => {
    const bytes = Buffer.from('%PDF-1.4 fake pdf body');
    const res = await request(app)
      .post('/api/upload/document')
      .set('Cookie', person.cookie)
      .field('name', 'Test Doc')
      .attach('document', bytes, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toContain('/uploads/documents/');
    expect(res.body.data.url.endsWith('.pdf')).toBe(true);
    expect(res.body.data.mimetype).toBe('application/pdf');
    expect(res.body.data.size).toBe(bytes.length);

    const doc = await Media.findOne({ alt: 'Test Doc' }).lean();
    expect(doc?.src).toBe(res.body.data.url);
  });

  it('accepts a valid xlsx upload with extension preserved', async () => {
    const res = await request(app)
      .post('/api/upload/document')
      .set('Cookie', person.cookie)
      .field('name', 'Sheet Doc')
      .attach('document', Buffer.from('fake xlsx'), {
        filename: 'sheet.XLSX',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.url.endsWith('.xlsx')).toBe(true);
    expect(res.body.data.mimetype).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('rejects unsupported file types', async () => {
    const res = await request(app)
      .post('/api/upload/document')
      .set('Cookie', person.cookie)
      .field('name', 'Bad Doc')
      .attach('document', Buffer.from('just text'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(await Media.findOne({ alt: 'Bad Doc' })).toBeNull();
  });

  it('rejects uploads without a name field', async () => {
    const res = await request(app)
      .post('/api/upload/document')
      .set('Cookie', person.cookie)
      .attach('document', Buffer.from('%PDF-1.4 no name'), {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
  });
});
