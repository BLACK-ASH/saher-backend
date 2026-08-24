import fs from 'fs';
import path from 'path';

import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import type { HydratedDocument } from 'mongoose';
import type { Page as PuppeteerPage } from 'puppeteer-core';

import { createSessionExcel } from '../events/export/session-excel.service.js';
import type { SessionType } from '../database/session.model.js';
import { Session } from '../database/session.model.js';
import { logger } from '../libs/logger/logger.js';
import { bullmqConnection } from '../libs/redis/redis-client.js';
import { getBrowser } from '../libs/utils/browser.js';
import { notification } from '../libs/utils/notification.js';
import { escapeHtml } from '../libs/utils/html-escape.js';
import 'dotenv/config';

const tempPath = path.join(process.cwd(), 'public', 'temp');

const ensureTempDir = () => {
  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });
};

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

type SessionDoc = HydratedDocument<SessionType>;
// populate('participants') hydrates ObjectIds into Participant docs; schema types don't reflect that
type PopulatedParticipant = { name?: string | null; phoneNumber?: string | null };

const fetchSession = async (job: Job): Promise<SessionDoc> => {
  const session = await Session.findOne({ _id: job.data.sessionId, isDeleted: false })
    .populate('program', 'title')
    .populate({
      path: 'participants',
      populate: { path: 'image document' },
    });

  if (!session) throw new Error(`Session ${job.data.sessionId} not found for report`);

  return session;
};


const createSessionPdfBody = (session: SessionDoc) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #09090b; font-family: Inter, Arial, sans-serif; }
    .header { border-bottom: 1px solid #e4e4e7; padding-bottom: 18px; margin-bottom: 20px; }
    .brand-name { font-size: 17px; font-weight: 700; color: #7a1cac; }
    .title h1 { font-size: 18px; font-weight: 700; }
    .meta { margin: 12px 0 20px; font-size: 12px; color: #52525b; }
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
  <div class="title"><h1>Session Report</h1></div>
  <div class="meta">
    <strong>${escapeHtml(String(session.get('title') ?? '-'))}</strong><br/>
    Program: ${escapeHtml(JSON.stringify(session.get('program')))}<br/>
    Date: ${formatDate(session.get('date'))}<br/>
    Participants: ${(session.participants ?? []).length}
  </div>
  <table>
    <thead><tr><th>Participant</th><th>Phone</th></tr></thead>
    <tbody>
      ${((session.participants ?? []) as unknown as PopulatedParticipant[])
        .map(
          (p) =>
            `<tr><td>${escapeHtml(p.name ?? '-')}</td><td>${escapeHtml(p.phoneNumber ?? '-')}</td></tr>`,
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

const renderPdf = async (job: Job, session: SessionDoc, page: PuppeteerPage) => {
  await page.setContent(createSessionPdfBody(session), { waitUntil: 'domcontentloaded' });
  ensureTempDir();
  const pdfPath = path.join(tempPath, `${job.id}.pdf`);
  await page.pdf({ format: 'A4', path: pdfPath, printBackground: true });
};

const notifyDownload = async (job: Job, sessionTitle: string, ext: 'pdf' | 'xlsx') => {
  const action = {
    type: 'download' as const,
    label: 'Report',
    url: `/api/attendance/download/${job.id}.${ext}`,
    method: 'GET' as const,
  };

  await notification.specific.info(
    [job.data.user],
    `session report generated - ${sessionTitle}`,
    'Your session report is ready to download.',
    action,
  );

  return action;
};

export const sessionReportWorker = new Worker(
  'pdf-session-report',
  async (job: Job) => {
    logger.info(`Session report job ${job.id} started.`);

    const session = await fetchSession(job);
    const ext = job.data.format === 'xlsx' ? 'xlsx' : 'pdf';

    if (ext === 'xlsx') {
      ensureTempDir();
      await createSessionExcel(session, path.join(tempPath, `${job.id}.xlsx`));
    } else {
      const browser = await getBrowser();
      const page = await browser.newPage();
      try {
        await renderPdf(job, session, page);
      } finally {
        await page.close().catch((err) =>
          logger.warn({ err }, `Failed to close page for job ${job.id}`),
        );
      }
    }

    return notifyDownload(job, String(session.get('title')), ext);
  },
  { connection: bullmqConnection },
);

sessionReportWorker.on('completed', (job) => {
  logger.info(`Session report job ${job.id} completed.`);
});

sessionReportWorker.on('failed', (job, err) => {
  logger.error(err, `Session report job ${job?.id} failed`);
});
