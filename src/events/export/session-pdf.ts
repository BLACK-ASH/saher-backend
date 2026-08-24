import type { HydratedDocument } from 'mongoose';

import type { SessionType } from '../../database/session.model.js';
import { escapeHtml } from '../../libs/utils/html-escape.js';

type SessionDoc = HydratedDocument<SessionType>;
// populate('participants') hydrates ObjectIds into Participant docs; schema types don't reflect that
export type PopulatedParticipant = { name?: string | null; phoneNumber?: string | null };

// works for hydrated mongoose docs and plain objects (report sample generator)
const read = <K extends string>(doc: unknown, key: K): unknown =>
  typeof (doc as { get?: unknown }).get === 'function'
    ? (doc as { get: (k: K) => unknown }).get(key)
    : (doc as Record<K, unknown>)[key];

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date as string));
};

const programTitle = (session: SessionDoc): string => {
  const program = read(session, 'program');
  if (program && typeof program === 'object' && 'title' in (program as object)) {
    return String((program as { title: unknown }).title);
  }
  return '-';
};

export const createSessionPdfBody = (session: SessionDoc) => {
  const participants = ((read(session, 'participants') ?? []) as unknown as PopulatedParticipant[]);
  const title = String(read(session, 'title') ?? '-');

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
    .meta { margin: 12px 0 20px; font-size: 12px; color: #52525b; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 16px; font-size: 12px; color: #71717a; border-bottom: 1px solid #e4e4e7; background: #fafafa; }
    td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #f4f4f5; }
    @page { size: A4; margin: 8mm; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-name">SAHER Internal</div>
    <div style="font-size:11px;color:#71717a;">Society for Awareness, Harmony and Equal Rights</div>
  </div>
  <h1>Session Report — ${escapeHtml(title)}</h1>
  <div class="meta">
    Program: ${escapeHtml(programTitle(session))}<br/>
    Date: ${formatDate(read(session, 'date') as string)}<br/>
    Participants: ${participants.length}
  </div>
  <table>
    <thead><tr><th>Participant</th><th>Phone</th></tr></thead>
    <tbody>
      ${participants
        .map(
          (p) =>
            `<tr><td>${escapeHtml(p.name ?? '-')}</td><td>${escapeHtml(p.phoneNumber ?? '-')}</td></tr>`,
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
};
