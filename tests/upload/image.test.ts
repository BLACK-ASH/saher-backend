import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { Media } from '../../src/database/media-upload.model.js';
import type { Ctx } from '../helpers/person.js';
import { mkPerson } from '../helpers/person.js';

let person: Ctx;

// Real 1x1 PNG — sharp must be able to transcode it to WebP
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

beforeEach(async () => {
  person = await mkPerson('user');
});

describe('bulk image upload', () => {
  it('accepts two valid images, converts both to WebP, and creates one Media row per file', async () => {
    const res = await request(app)
      .post('/api/upload/images')
      .set('Cookie', person.cookie)
      .attach('images', png, { filename: 'one.png', contentType: 'image/png' })
      .attach('images', png, { filename: 'two.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].url).toContain('/uploads/images/');
    expect(res.body.data[0].url.endsWith('.webp')).toBe(true);
    expect(res.body.data[1].url.endsWith('.webp')).toBe(true);
    expect(res.body.data[0].mimetype).toBe('image/webp');
    expect(res.body.data[1].mimetype).toBe('image/webp');

    const first = await Media.findOne({ src: res.body.data[0].url }).lean();
    const second = await Media.findOne({ src: res.body.data[1].url }).lean();
    expect(first?.alt).toBe('one.png');
    expect(second?.alt).toBe('two.jpg');
  });

  it('rejects a batch containing an unsupported file type', async () => {
    const res = await request(app)
      .post('/api/upload/images')
      .set('Cookie', person.cookie)
      .attach('images', png, { filename: 'ok.png', contentType: 'image/png' })
      .attach('images', Buffer.from('just text'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(await Media.findOne({ alt: 'ok.png' })).toBeNull();
  });

  it('rejects an empty batch', async () => {
    const res = await request(app)
      .post('/api/upload/images')
      .set('Cookie', person.cookie);

    expect(res.status).toBe(400);
  });
});
