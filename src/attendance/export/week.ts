import type { Request, Response } from 'express';

import { createWeekBody } from './template/week.js';
import { getBrowser } from '../../libs/utils/browser.js';

export const exportWeekController = async (req: Request, res: Response) => {
  const browser = await getBrowser();

  const page = await browser.newPage();

  const data = [
    {
      id: '69fc1ce62bd23fdda0a95303',
      user: {
        name: 'captain_america',
        email: 'captain_america@saher.com',
        role: 'user',
        id: '69f8352ac75c136c1e837b45',
      },
      inTime: null,
      outTime: null,
      workHours: 0,
      date: '2026-05-07',
      status: 'absent',
      isLate: true,
    },
    {
      id: '69fc1ce62bd23fdda0a952f6',
      user: {
        name: 'user',
        email: 'user@saher.com',
        role: 'user',
        id: '69e71a2960e4056f291fb954',
      },
      inTime: null,
      outTime: null,
      workHours: 0,
      date: '2026-05-07',
      status: 'absent',
      isLate: true,
    },
    {
      id: '69fc1ce62bd23fdda0a952f7',
      user: {
        name: 'YusufSabah',
        email: 'Coordinatorsaher@gmail.com',
        role: 'user',
        id: '69e8a1e776d7e6c40b716e7b',
      },
      inTime: null,
      outTime: null,
      workHours: 0,
      date: '2026-05-07',
      status: 'absent',
      isLate: true,
    },
    {
      id: '69fc1ce62bd23fdda0a952f8',
      user: {
        name: 'manager_saher',
        email: 'manager@saher.com',
        role: 'manager',
        id: '69e8e46d38ef2d57999dcdf4',
      },
      inTime: null,
      outTime: null,
      workHours: 0,
      date: '2026-05-07',
      status: 'absent',
      isLate: true,
    },
    {
      id: '69fc18752bd23fdda0a952cf',
      user: {
        name: 'Admin_Saher',
        email: 'admin@saher.com',
        role: 'admin',
        id: '69e719c3da96f2f8b85422a7',
      },
      inTime: '2026-05-07T04:43:33.056Z',
      outTime: null,
      workHours: 0,
      date: '2026-05-07',
      status: 'present',
      isLate: false,
    },
  ];

  // @ts-expect-error - types are same
  const html = createWeekBody(data);

  await page.setContent(html, {
    waitUntil: 'networkidle0',
  });

  const pdf = await page.pdf({
    format: 'A4',
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

      <div>
        SAHER Internal
      </div>

      <div>
        Designed & Developed by
        <span style="font-weight:600;color:#7a1cac;">
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

  res.setHeader('Content-Type', 'application/pdf');

  const filename = req.user?.name || 'attendance' + Date;
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  res.send(pdf);
};
