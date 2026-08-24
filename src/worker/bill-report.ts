import fs from 'fs';
import path from 'path';

import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import type { Page as PuppeteerPage } from 'puppeteer-core';

import { Bill } from '../database/bill.model.js';
import type { QueryFilter } from 'mongoose';
import { createBillExcel } from '../reimbursement/export/bill-excel.service.js';
import type { BillDocumentT } from '../reimbursement/export/types.js';
import { logger } from '../libs/logger/logger.js';
import { bullmqConnection } from '../libs/redis/redis-client.js';
import { getBrowser } from '../libs/utils/browser.js';
import { escapeHtml } from '../libs/utils/html-escape.js';
import { notification } from '../libs/utils/notification.js';
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

const createBillPdfBody = (bills: BillDocumentT[]) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #09090b; font-family: Inter, Arial, sans-serif; }
    .header { border-bottom: 1px solid #e4e4e7; padding-bottom: 18px; margin-bottom: 20px; }
    .brand-name { font-size: 17px; font-weight: 700; color: #7a1cac; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 12px 14px; font-size: 12px; color: #71717a; border-bottom: 1px solid #e4e4e7; background: #fafafa; }
    td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f4f4f5; }
    @page { size: A4; margin: 8mm; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-name">SAHER Internal</div>
    <div style="font-size:11px;color:#71717a;">Society for Awareness, Harmony and Equal Rights</div>
  </div>
  <h1 style="font-size:18px;">Bill Report</h1>
  <table>
    <thead><tr><th>Employee</th><th>Amount</th><th>Advance</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>
      ${bills
        .map(
          (b) => `<tr>
            <td>${escapeHtml(b.user?.displayName ?? b.user?.email ?? '-')}</td>
            <td>${b.amount ?? 0}</td>
            <td>${b.advance ?? 0}</td>
            <td>${escapeHtml(String(b.status))}</td>
            <td>${formatDate(b.date)}</td>
          </tr>`,
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

const renderPdf = async (job: Job, bills: BillDocumentT[], page: PuppeteerPage) => {
  await page.setContent(createBillPdfBody(bills), { waitUntil: 'domcontentloaded' });
  ensureTempDir();
  await page.pdf({
    format: 'A4',
    path: path.join(tempPath, `${job.id}.pdf`),
    printBackground: true,
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
