import fs from 'fs';
import path from 'path';

import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import type { Page as PuppeteerPage } from 'puppeteer-core';

import { Bill } from '../database/bill.model.js';
import type { QueryFilter } from 'mongoose';
import { createBillExcel } from '../reimbursement/export/bill-excel.service.js';
import { createBillPdfBody } from '../reimbursement/export/bill-pdf.js';
import type { BillDocumentT } from '../reimbursement/export/types.js';
import { logger } from '../libs/logger/logger.js';
import { bullmqConnection } from '../libs/redis/redis-client.js';
import { getBrowser } from '../libs/utils/browser.js';
import { escapeHtml } from '../libs/utils/html-escape.js';
import { notification } from '../libs/utils/notification.js';
import { pdfFooterTemplate, pdfPageConfig } from '../libs/utils/pdf-config.js';
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

const fetchBills = async (job: Job): Promise<BillDocumentT[]> => {
  const query = job.data.query as QueryFilter<never>;
  // populate user subset for the Employee column; schema types keep ObjectId
  const bills = await Bill.find(query)
    .populate<{ user: { displayName?: string; email?: string } }>('user', 'displayName email')
    .sort({ createdAt: -1 })
    .lean();

  if (!bills.length) throw new Error('No bills matched the export filters');

  return bills as unknown as BillDocumentT[];
};

const renderPdf = async (job: Job, bills: BillDocumentT[], page: PuppeteerPage) => {
  await page.setContent(createBillPdfBody(bills), { waitUntil: 'domcontentloaded' });
  ensureTempDir();
  await page.pdf({
    ...pdfPageConfig,
    path: path.join(tempPath, `${job.id}.pdf`),
    footerTemplate: pdfFooterTemplate,
  });
};

export const billReportWorker = new Worker(
  'pdf-bill-report',
  async (job: Job) => {
    logger.info(`Bill report job ${job.id} started.`);

    const bills = await fetchBills(job);
    const ext = job.data.format === 'xlsx' ? 'xlsx' : 'pdf';

    if (ext === 'xlsx') {
      ensureTempDir();
      await createBillExcel(bills, path.join(tempPath, `${job.id}.xlsx`));
    } else {
      const browser = await getBrowser();
      const page = await browser.newPage();
      try {
        await renderPdf(job, bills, page);
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
      `bill report generated (${bills.length} bills)`,
      'Your bill report is ready to download.',
      action,
    );

    return action;
  },
  { connection: bullmqConnection },
);

billReportWorker.on('completed', (job) => {
  logger.info(`Bill report job ${job.id} completed.`);
});

billReportWorker.on('failed', (job, err) => {
  logger.error(err, `Bill report job ${job?.id} failed`);
});
