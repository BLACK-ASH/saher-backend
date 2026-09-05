import fs from 'node:fs';
import path from 'node:path';

import type { HydratedDocument } from 'mongoose';

import type { SessionType } from '../../database/session.model.js';
import { env } from '../../config/env.js';
import { escapeHtml } from '../../libs/utils/html-escape.js';
import { htmlToText } from '../../libs/utils/html-to-text.js';

type SessionDoc = HydratedDocument<SessionType>;
// populated refs aren't reflected in schema types
type PopulatedMedia = { src?: string | null; alt?: string | null };
type PopulatedBill = {
  amount?: number | null;
  date?: Date | string | null;
  description?: string | null;
  status?: string | null;
};
type PopulatedSpeaker = { name?: string | null; email?: string | null };
type PopulatedParticipant = { name?: string | null; phoneNumber?: string | null };
type PopulatedProgram = { title?: string | null; participants?: unknown };
type PopulatedWorkshop = { title?: string | null };

// works for hydrated mongoose docs and plain objects (report sample generator)
const read = <K extends string>(doc: unknown, key: K): unknown =>
  typeof (doc as { get?: unknown }).get === 'function'
    ? (doc as { get: (k: K) => unknown }).get(key)
    : (doc as Record<K, unknown>)[key];

const formatDate = (date: unknown) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date as string));
};

const formatTime = (date: unknown) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date as string));
};

const titleOf = (ref: unknown): string => {
  if (ref && typeof ref === 'object' && 'title' in (ref as object)) {
    return String((ref as { title: unknown }).title ?? '-');
  }
  return '-';
};

const asParticipants = (list: unknown): PopulatedParticipant[] =>
  (Array.isArray(list) ? list : []) as unknown as PopulatedParticipant[];
const hasId = (doc: unknown, ids: Set<string>): boolean => {
  const id = (doc as { _id?: unknown })?._id ?? (doc as { id?: unknown })?.id;
  return ids.has(String(id));
};
const participantIds = (doc: unknown): string[] => {
  const list = read(doc, 'participants');
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => String((p as { _id?: unknown })?._id ?? (p as { id?: unknown })?.id))
    .filter(Boolean);
};

export const createSessionPdfBody = async (session: SessionDoc) => {
  const sessionId = String((session as { _id?: unknown })?._id ?? '');
  const presentSet = new Set(participantIds(session));

  // roster = program participants (all registered); session participants mark who showed up
  const program = read(session, 'program') as PopulatedProgram | undefined;
  const roster = asParticipants(program?.participants);

  const images = (read(session, 'images') ?? []) as unknown as PopulatedMedia[];
  const bills = (read(session, 'bills') ?? []) as unknown as PopulatedBill[];
  const speakers = (read(session, 'speaker') ?? []) as unknown as PopulatedSpeaker[];

  const title = String(read(session, 'title') ?? '-');
  const description = htmlToText(String(read(session, 'description') ?? ''));
  const review = htmlToText(String(read(session, 'review') ?? ''));
  const imageHost = env.BASE_URL;

  // brand logo lives in public/saher-logo.png (worker cwd is repo root)
  let logoDataUri = '';
  try {
    const logoPath = path.join(process.cwd(), 'public', 'saher-logo.png');
    if (fs.existsSync(logoPath)) {
      logoDataUri = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
    }
  } catch {
    // branding is cosmetic — keep the text header if the logo can't be read
  }

  // embed images as base64 so puppeteer renders them without network waits
  const embedImage = async (src: string): Promise<string> => {
    try {
      const res = await fetch(imageHost + src);
      if (!res.ok) return '';
      const contentType = res.headers.get('content-type') ?? '';
      const mime = contentType.startsWith('image/')
        ? contentType
        : `image/${(src.split('.').pop() ?? 'jpeg').replace(/[^a-z]/gi, '')}`;
      const buf = Buffer.from(await res.arrayBuffer());
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch {
      return '';
    }
  };

  const galleryItems = await Promise.all(
    images.map(async (img) => ({
      src: await embedImage(img.src ?? ''),
      alt: img.alt ?? '',
    })),
  );
  const embedded = galleryItems.filter((i) => i.src);
  const galleryRows = embedded
    .map(
      (img) => `<figure style="margin:0;width:calc(50% - 6px);">
        <img src="${img.src}" style="width:100%;height:220px;object-fit:cover;border-radius:6px;display:block;" />
        ${img.alt ? `<figcaption style="font-size:11px;color:#71717a;padding-top:6px;">${escapeHtml(img.alt)}</figcaption>` : ''}
      </figure>`,
    )
    .join('');

  const attendanceRows = roster.length
    ? roster
        .map((p) => {
          const present = hasId(p, presentSet);
          return `<tr>
            <td>${escapeHtml(p.name ?? '-')}</td>
            <td>${escapeHtml(p.phoneNumber ?? '-')}</td>
            <td>${present ? 'Present' : 'Absent'}</td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="3" style="color:#71717a;">No participants registered for the program.</td></tr>';

  const billRows = bills
    .map(
      (b) => `<tr>
        <td>${escapeHtml(b.description ?? '-')}</td>
        <td>${formatDate(b.date)}</td>
        <td>₹${Number(b.amount ?? 0).toLocaleString('en-IN')}</td>
        <td>${escapeHtml(b.status ?? '-')}</td>
      </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #09090b; font-family: Inter, Arial, sans-serif; }
    .header { border-bottom: 1px solid #e4e4e7; padding-bottom: 18px; margin-bottom: 20px; }
    .brand-name { font-size: 17px; font-weight: 700; color: #7a1cac; }
    h1 { font-size: 18px; font-weight: 700; margin: 8px 0; }
    h2 { font-size: 14px; font-weight: 700; margin: 28px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e4e4e7; }
    .meta { margin: 12px 0 8px; font-size: 12px; color: #52525b; line-height: 1.8; }
    .description { font-size: 13px; color: #3f3f46; line-height: 1.7; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 12px; font-size: 12px; color: #71717a; border-bottom: 1px solid #e4e4e7; background: #fafafa; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f4f4f5; }
    .grid { display: flex; flex-wrap: wrap; gap: 12px; }
    @page { size: A4; }
  </style>
</head>
<body>
  <div class="header" style="display:flex;align-items:center;gap:14px;">
    ${logoDataUri ? `<img src="${logoDataUri}" style="height:44px;width:auto;" alt="SAHER logo" />` : ''}
    <div>
      <div class="brand-name">SAHER</div>
      <div style="font-size:11px;color:#71717a;">Society for Awareness, Harmony and Equal Rights</div>
    </div>
  </div>

  <h1>Session Report — ${escapeHtml(title)}</h1>
  <div class="meta">
    Program: ${escapeHtml(titleOf(program))}<br/>
    Workshop: ${escapeHtml(titleOf(read(session, 'workshop')))}<br/>
    Date: ${formatDate(read(session, 'date'))} &nbsp; ${formatTime(read(session, 'startTime'))} – ${formatTime(read(session, 'endTime'))}<br/>
    Speakers: ${speakers.map((s) => escapeHtml(s.name ?? '')).join(', ') || '-'}<br/>
    Register/Hour ID: ${escapeHtml(sessionId)}
  </div>
  ${description ? `<p style="white-space:pre-wrap;" class="description">${escapeHtml(description)}</p>` : ''}

  ${review ? `
  <h2>Review</h2>
  <p style="white-space:pre-wrap;" class="description">${escapeHtml(review)}</p>
  ` : ''}

  <h2>Attendance (${roster.length})</h2>
  <table>
    <thead><tr><th>Participant</th><th>Phone</th><th>Status</th></tr></thead>
    <tbody>${attendanceRows}</tbody>
  </table>

  ${embedded.length ? `
  <h2>Images (${embedded.length})</h2>
  <div class="grid">${galleryRows}</div>
  ` : ''}

  ${bills.length ? `
  <h2>Bills (${bills.length})</h2>
  <table>
    <thead><tr><th>Description</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
    <tbody>${billRows}</tbody>
  </table>
  ` : ''}
</body>
</html>`;
};
