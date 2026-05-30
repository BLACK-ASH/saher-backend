import fs from 'fs';
import path from 'path';

import type { Job} from 'bullmq';
import { Worker } from 'bullmq';

import { retrieveCustomAttendace } from '../attendance/attendance.service.js';
import { logger } from '../libs/logger/logger.js';
import { getBrowser } from '../libs/utils/browser.js';
import { createAttendancePdfBody } from './attendance/template/attendance-pdf.js';
import { notification } from '../libs/utils/notification.js';

const tempPath = path.join(process.cwd(), 'public', 'temp');

const generateAttendanceReportPdf = async (job: Job) => {
  logger.info(`Job ${job.id} started.`);

  const browser = await getBrowser();

  const page = await browser.newPage();

  const data = await retrieveCustomAttendace(job.data.user, job.data.startDate, job.data.endDate, {
    page: 1,
    limit: 1000,
    sort: 'desc',
  });

  const html = createAttendancePdfBody(data);

  await page.setContent(html, {
    waitUntil: 'domcontentloaded',
  });

  // 1. Define the destination folder path

  // 2. Safely create the folders if they do not exist yet
  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

  // 3. Combine folder path with your desired file name
  const pdfPath = path.join(tempPath, `${job.id}.pdf`);
  const downloadPath = `/api/attendance/download/${job.id}.pdf`;

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

  const action = {
    type: 'download' as const,
    label: 'Report',
    url: downloadPath,
    method: 'GET' as const,
  };

  await notification.specific.info(
    [job.data.user],
    `attendance report generated, type - ${job.data.type} `,
    `attendance report from ${data[0].date} - ${data[data.length - 1].date}`,
    action,
  );

  return action;
};

export const attendanceReportWorker = new Worker(
  'pdf-attendance-report',
  generateAttendanceReportPdf,
  {
    connection: {
      host: 'redis',
      port: 6379,
      maxRetriesPerRequest: null,
    },
  },
);

attendanceReportWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed.`);
});

attendanceReportWorker.on('failed', (job, err) => {
  logger.error(err, `Job ${job?.id} failed`);
});
