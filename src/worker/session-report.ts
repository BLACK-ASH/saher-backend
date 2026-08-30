import fs from 'fs';
import path from 'path';

import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import type { HydratedDocument } from 'mongoose';
import type { Page as PuppeteerPage } from 'puppeteer-core';

import { createSessionExcel } from '../events/export/session-excel.service.js';
import { createSessionPdfBody } from '../events/export/session-pdf.js';
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
    .populate('workshop', 'title')
    .populate({
      path: 'participants',
      populate: { path: 'image document' },
    });

  if (!session) throw new Error(`Session ${job.data.sessionId} not found for report`);

  return session;
};


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
