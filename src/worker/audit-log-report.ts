import fs from 'fs';
import path from 'path';

import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import type { Page as PuppeteerPage } from 'puppeteer-core';

import { AuditLog } from '../database/audit-log.model.js';
import { logger } from '../libs/logger/logger.js';
import { bullmqConnection } from '../libs/redis/redis-client.js';
import { getBrowser } from '../libs/utils/browser.js';
import { notification } from '../libs/utils/notification.js';
import { pdfFooterTemplate, pdfPageConfig } from '../libs/utils/pdf-config.js';
import { createAuditLogExcel } from '../reimbursement/export/audit-log-excel.js';
import { createAuditLogPdfBody } from '../reimbursement/export/audit-log-pdf.js';
import 'dotenv/config';

const tempPath = path.join(process.cwd(), 'public', 'temp');

const ensureTempDir = () => {
  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });
};

export const auditLogReportWorker = new Worker(
  'pdf-audit-log-report',
  async (job: Job) => {
    logger.info(`Audit log report job ${job.id} started.`);

    // ledger rows have no timestamps — ObjectId order approximates insertion order
    const entries = await AuditLog.find().sort({ _id: -1 }).lean();
    const ext = job.data.format === 'xlsx' ? 'xlsx' : 'pdf';
    ensureTempDir();
    const filePath = path.join(tempPath, `${job.id}.${ext}`);

    if (ext === 'xlsx') {
      await createAuditLogExcel(entries, filePath);
    } else {
      const browser: Awaited<ReturnType<typeof getBrowser>> = await getBrowser();
      const page: PuppeteerPage = await browser.newPage();
      try {
        await page.setContent(createAuditLogPdfBody(entries), { waitUntil: 'domcontentloaded' });
        await page.pdf({
          ...pdfPageConfig,
          path: filePath,
          footerTemplate: pdfFooterTemplate,
        });
      } finally {
        await page.close().catch((err) =>
          logger.warn({ err }, `Failed to close page for job ${job.id}`),
        );
      }
    }

    const action = {
      type: 'download' as const,
      label: 'Report',
      url: `/api/attendance/download/${String(job.id)}.${ext}`,
      method: 'GET' as const,
    };

    await notification.specific.info(
      [job.data.user],
      `Books of account report generated (${entries.length} entries)`,
      'Your audit log report is ready to download.',
      action,
    );

    return action;
  },
  { connection: bullmqConnection },
);

auditLogReportWorker.on('completed', (job) => {
  logger.info(`Audit log report job ${job.id} completed.`);
});

auditLogReportWorker.on('failed', (job, err) => {
  logger.error(err, `Audit log report job ${job?.id} failed`);
});