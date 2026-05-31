import type { Request, Response } from 'express';
import z from 'zod';

import { calendarObject } from './calendar.schema.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { createKey, getCache, setCache } from '../libs/redis/redis-utils.js';
import { getCalendarHoliday } from '../libs/utils/calendar.js';

export const getCalendarEventByMonth = async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);

  const key = createKey('calendar', year, month + 1);
  const cachedData = await getCache(key);
  if (cachedData) {
    const parsed = z.array(calendarObject).parse(cachedData);

    return ApiResponse.success(res, {
      message: 'the data from Cache  ',
      data: parsed,
      statusCode: 200,
    });
  }
  const result = await getCalendarHoliday(year, month);
  await setCache(key, result, 7776000);
  // console.log('before resp', result);
  return ApiResponse.success(res, {
    message: 'the data from DB ',
    data: result,
    statusCode: 200,
  });
};
