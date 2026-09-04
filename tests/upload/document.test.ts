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
    expect(res.body.data.src).toContain('/uploads/documents/');
    expect(res.body.data.src.endsWith('.pdf')).toBe(true);
    expect(res.body.data.mimetype).toBe('application/pdf');
    expect(res.body.data.size).toBe(bytes.length);
    expect(res.body.data.alt).toBe('Test Doc');

    const doc = await Media.findOne({ alt: 'Test Doc' }).lean();
    expect(doc?.src).toBe(res.body.data.src);
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
    expect(res.body.data.src.endsWith('.xlsx')).toBe(true);
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

describe('bulk document upload', () => {
  it('accepts two valid files and creates one Media row per file', async () => {
    const pdf = Buffer.from('%PDF-1.4 bulk one');
    const xlsx = Buffer.from('fake xlsx bulk');

    const res = await request(app)
      .post('/api/upload/documents')
      .set('Cookie', person.cookie)
      .attach('documents', pdf, { filename: 'one.pdf', contentType: 'application/pdf' })
      .attach('documents', xlsx, {
        filename: 'two.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].src).toContain('/uploads/documents/');
    expect(res.body.data[0].mimetype).toBe('application/pdf');
    expect(res.body.data[0].size).toBe(pdf.length);
    expect(res.body.data[0].alt).toBe('one.pdf');
    expect(res.body.data[1].src.endsWith('.xlsx')).toBe(true);
    expect(res.body.data[1].alt).toBe('two.xlsx');

    const first = await Media.findOne({ src: res.body.data[0].src }).lean();
    const second = await Media.findOne({ src: res.body.data[1].src }).lean();
    expect(first?.alt).toBe('one.pdf');
    expect(second?.alt).toBe('two.xlsx');
  });

  it('rejects a batch containing an unsupported file type', async () => {
    const res = await request(app)
      .post('/api/upload/documents')
      .set('Cookie', person.cookie)
      .attach('documents', Buffer.from('%PDF-1.4 ok'), {
        filename: 'ok.pdf',
        contentType: 'application/pdf',
      })
      .attach('documents', Buffer.from('just text'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(await Media.findOne({ alt: 'ok.pdf' })).toBeNull();
  });

  it('rejects an empty batch', async () => {
    const res = await request(app)
      .post('/api/upload/documents')
      .set('Cookie', person.cookie);

    expect(res.status).toBe(400);
  });
});
