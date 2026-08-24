// Generates sample report artifacts (xlsx + html) using the REAL production
/* eslint-disable no-console */
// renderers — no duplicated templates. Run: npx tsx scripts/generate-report-samples.ts
// PDFs are printed from the identical HTML by headless chromium (see samples/README.md).
import fs from 'node:fs/promises';
import path from 'node:path';

import { createAttendanceExcel } from '../src/attendance/export/excel.service.js';
import { createAttendancePdfBody } from '../src/worker/attendance/template/attendance-pdf.js';
import { createSessionExcel } from '../src/events/export/session-excel.service.js';
import { createSessionPdfBody } from '../src/events/export/session-pdf.js';
import { createBillExcel } from '../src/reimbursement/export/bill-excel.service.js';
import { createBillPdfBody } from '../src/reimbursement/export/bill-pdf.js';

const out = path.join(process.cwd(), 'samples', 'reports');
await fs.mkdir(out, { recursive: true });

/* ---------------- mock data shaped exactly like the production query output ---------------- */

const attUser = {
  id: '6a8c09c27add235ce7480001',
  name: 'Aisha Rahman',
  email: 'aisha.rahman@saher.org',
  role: 'user',
  empId: 'SAHER-014',
  isVerified: true,
  isActive: true,
};

const attendance = [
  { id: 'a1', user: attUser, date: '2026-08-17', inTime: '2026-08-17T04:05:00.000Z', outTime: '2026-08-17T12:35:00.000Z', workHours: 8.5, status: 'present' as const, isLate: false },
  { id: 'a2', user: attUser, date: '2026-08-18', inTime: '2026-08-18T04:42:00.000Z', outTime: '2026-08-18T12:30:00.000Z', workHours: 7.8, status: 'present' as const, isLate: true },
  { id: 'a3', user: attUser, date: '2026-08-19', inTime: null, outTime: null, workHours: 0, status: 'week-off' as const, isLate: false },
  { id: 'a4', user: attUser, date: '2026-08-20', inTime: '2026-08-20T04:02:00.000Z', outTime: '2026-08-20T10:32:00.000Z', workHours: 6.5, status: 'half-day' as const, isLate: false },
  { id: 'a5', user: attUser, date: '2026-08-21', inTime: null, outTime: null, workHours: 0, status: 'on-leave' as const, isLate: false },
];

const session = {
  title: 'Digital Literacy Workshop — Batch 3',
  description: 'Hands-on computer basics for community participants.',
  date: '2026-09-01',
  startTime: new Date('2026-09-01T03:30:00.000Z'),
  endTime: new Date('2026-09-01T06:30:00.000Z'),
  program: { _id: 'p1', title: 'Community Skills Program' },
  speaker: [{ displayName: 'Mohammed Irfan' }],
  participants: [
    { name: 'Fatima Noor', phoneNumber: '9876543210' },
    { name: 'Ravi Kumar', phoneNumber: '9812345678' },
    { name: 'Sana Sheikh', phoneNumber: '9900112233' },
    { name: 'Arif Ali', phoneNumber: '9765432109' },
  ],
} as never; // renderer only reads these fields

const bills = [
  { amount: 450, advance: 200, status: 'accept', date: new Date('2026-08-05'), description: 'Field travel — outreach camp', user: { displayName: 'Aisha Rahman' } },
  { amount: 1250, advance: 0, status: 'pending', date: new Date('2026-08-12'), description: 'Workstation RAM upgrade', user: { displayName: 'Rohit Sharma' } },
  { amount: 300, advance: 300, status: 'settle' as never, date: new Date('2026-08-15'), description: 'Stationery for workshop kits', user: { displayName: 'Aisha Rahman' } },
] as never;

/* ------------------------------- write xlsx via real services ------------------------------ */

await createAttendanceExcel(attendance as never, path.join(out, 'attendance-report.xlsx'));
await createSessionExcel(session, path.join(out, 'session-report.xlsx'));
await createBillExcel(bills, path.join(out, 'bill-report.xlsx'));

/* -------------------- write the exact HTML strings the workers print to PDF ---------------- */

await fs.writeFile(path.join(out, 'attendance-report.html'), createAttendancePdfBody(attendance as never));
await fs.writeFile(path.join(out, 'session-report.html'), createSessionPdfBody(session));
await fs.writeFile(path.join(out, 'bill-report.html'), createBillPdfBody(bills));

console.log('report samples written to samples/reports/');
