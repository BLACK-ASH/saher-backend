import fs from 'fs';
import path from 'path';

import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import type { Page as PuppeteerPage } from 'puppeteer-core';

import { retrieveCustomAttendace } from '../attendance/attendance.service.js';
import { attendanceListSchema } from '../attendance/retrieve/attendance.schema.js';
import type { AttendanceResponseT } from '../attendance/retrieve/attendance.schema.js';
import { Attendance } from '../database/attendance.model.js';
import { createAttendanceExcel } from '../attendance/export/excel.service.js';
import { logger } from '../libs/logger/logger.js';
import { bullmqConnection } from '../libs/redis/redis-client.js';
import { getBrowser } from '../libs/utils/browser.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';
import { standardDateString } from '../libs/utils/standard-date.js';
import { createAttendancePdfBody } from './attendance/template/attendance-pdf.js';
import { notification } from '../libs/utils/notification.js';

const tempPath = path.join(process.cwd(), 'public', 'temp');

const fetchParsed = async (job: Job): Promise<AttendanceResponseT[]> => {
  let parsed;

  if (job.data.user === 'all') {
    const records = (await Attendance.find({
      date: { $gte: standardDateString(job.data.startDate), $lte: standardDateString(job.data.endDate) },
    })
      .populate('user', 'name email role ')
      .populate({
        path: 'user',
        populate: [{ path: 'image', model: 'Media' }],
      })
      .sort({ date: 1 })
      .limit(5000)
      .lean()) as unknown[];

    parsed = attendanceListSchema.parse(normalizeDoc(records));
  } else {
    const data = await retrieveCustomAttendace(job.data.user, job.data.startDate, job.data.endDate, {
      page: 1,
      limit: 1000,
      sort: 'desc',
    });
    parsed = data.parsed;
  }

  // empty range would crash on data.parsed[0].date below
  if (!parsed.length) {
    throw new Error(`No attendance records found${job.data.user === 'all' ? '' : ` for user ${job.data.user}`} in range`);
  }

  return parsed;
};

const notifyDownload = async (job: Job, parsed: AttendanceResponseT[], url: string) => {
  const action = {
    type: 'download' as const,
    label: 'Report',
    url,
    method: 'GET' as const,
  };

  // `user` is 'all' for all-employees exports — notify the requesting admin/manager instead
  const recipient = job.data.requestedBy ?? job.data.user;

  await notification.specific.info(
    [recipient],
    `attendance report generated, type - ${job.data.type} `,
    `attendance report from ${parsed[0].date} - ${parsed[parsed.length - 1].date}`,
    action,
  );

  return action;
};

const ensureTempDir = () => {
  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });
};

const generateAttendanceReportPdf = async (job: Job) => {
  logger.info(`Job ${job.id} started.`);

  // xlsx needs no Chromium
  if (job.data.format === 'xlsx') {
    const parsed = await fetchParsed(job);
    ensureTempDir();
    await createAttendanceExcel(parsed, path.join(tempPath, `${job.id}.xlsx`));
    return notifyDownload(job, parsed, `/api/attendance/download/${job.id}.xlsx`);
  }

  const browser = await getBrowser();

  // try/finally — a crashed job must never abandon its Chromium page (FD leak per job)
  const page = await browser.newPage();
  try {
    return await renderJob(job, page);
  } finally {
    await page.close().catch((err) => logger.warn({ err }, `Failed to close page for job ${job.id}`));
  }
};

const renderJob = async (job: Job, page: PuppeteerPage) => {
  const parsed = await fetchParsed(job);

  const html = createAttendancePdfBody(parsed);

  await page.setContent(html, {
    waitUntil: 'domcontentloaded',
  });

  ensureTempDir();

  const pdfPath = path.join(tempPath, `${job.id}.pdf`);

  await page.pdf({
    format: 'A4',
    path: pdfPath,
    printBackground: true,
    displayHeaderFooter: true,

    margin: {
      top: '40px',
      bottom: '70px',
      left: '20px',
      right: '20px',
    },

    footerTemplate: `
    <div
      style="
        width:100%;
        padding:0 24px;
        font-size:10px;
        color:#71717a;
        font-family:Arial,sans-serif;
        display:flex;
        justify-content:space-between;
        align-items:center;
      "
    >

      <div style="font-weight:600;color:#7a1cac;">
        SAHER Internal
      </div>

      <div>
        Designed & Developed by
        <span style="font-weight:600;color:black">
          BlackAsh
        </span>
      </div>

      <div>
        Page
        <span class="pageNumber"></span>
        of
        <span class="totalPages"></span>
      </div>

    </div>
  `,
  });

  return notifyDownload(job, parsed, `/api/attendance/download/${job.id}.pdf`);
};

export const attendanceReportWorker = new Worker(
  'pdf-attendance-report',
  generateAttendanceReportPdf,
  {
    connection: bullmqConnection,
  },
);

attendanceReportWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed.`);
});

attendanceReportWorker.on('failed', (job, err) => {
  logger.error(err, `Job ${job?.id} failed`);
});
