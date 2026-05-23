import type { Request, Response } from 'express';

import { createWeekBody } from './template/week.js';
import { ApiError } from '../../libs/class/api-error.js';
import { getBrowser } from '../../libs/utils/browser.js';
import { retrieveTypeWeekAttendance } from '../attendance.service.js';

export const exportWeekController = async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(403, 'Forbidden: Action Not Allowed');

  const browser = await getBrowser();

  const page = await browser.newPage();

  const data = await retrieveTypeWeekAttendance(req.user?.id, {});

  const html = createWeekBody(data);

  await page.setContent(html, {
    waitUntil: 'domcontentloaded',
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

  res.setHeader('Content-Type', 'application/pdf');

  const filename = `${req.user?.name}-${data[0].date}-${data[data.length - 1].date}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  res.send(pdf);
};
