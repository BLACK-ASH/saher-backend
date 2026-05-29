import type { Request, Response } from 'express';

import { ApiResponse } from '../libs/class/api-response.js';
import { getCalendarHoliday } from '../libs/utils/calendar.js';

export const getCalendarEventByMonth = async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  const result = await getCalendarHoliday(year, month);

  // console.log('before resp', result);
  return ApiResponse.success(res, {
    data: result,
    statusCode: 200,
  });
};
