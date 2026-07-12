import type { Request, Response } from 'express';

import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import {
  retrieveCustomAttendace,
  retrieveTypeMonthAttendance,
  retrieveTypeWeekAttendance,
  retrieveTypeYearAttendance,
} from '../attendance.service.js';

export const retrieveAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(400, 'Unauthorized');

  let id: string;
  // Get the user body
  if (user.role === 'user' || user.role === 'intern') {
    id = user.id;
  } else {
    if (req.params.id === 'me') {
      id = req.user?.id as string;
    } else {
      id = req.params.id as string;
    }
  }
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sort = req.query.sort as string;

  //Agar user ko ek custom range chahiyetoh oos case mein user ko startDate and endDate dono hii banatani padegi
  if (req.query.startDate && req.query.endDate) {
    const start = new Date(req.query.startDate as string);
    start.setHours(0, 0, 0, 0);

    const end = new Date(req.query.endDate as string);
    end.setHours(23, 59, 59, 999);

    if (start > end)
      throw new ApiError(400, 'The Dates that you have entered are invalid please check');

    const startDate = standardDateString(start);
    const endDate = standardDateString(end);
    const record = await retrieveCustomAttendace(id, startDate, endDate, { page, limit, sort });
    const count = record.count;
    return ApiResponse.success(res, {
      statusCode: 200,
      message: ' the attendance that you asked for ',
      data: record.parsed,
      meta: { page, limit, count, total: Math.ceil(count / limit) },
    });
  } else if (req.query.type) {
    if (req.query.type === 'week') {
      const record = await retrieveTypeWeekAttendance(id, { page, limit, sort });
      const count = record.count;
      return ApiResponse.success(res, {
        statusCode: 200,
        message: ' the attendance that you asked for ',
        data: record.parsed,
        meta: { page, limit, count, total: Math.ceil(count / limit) },
      });
    } else if (req.query.type === 'month') {
      const record = await retrieveTypeMonthAttendance(id, { page, limit, sort });
      const count = record.count;
      return ApiResponse.success(res, {
        statusCode: 200,
        message: ' the attendance that you asked for ',
        data: record.parsed,
        meta: { page, limit, count, total: Math.ceil(count / limit) },
      });
    } else if (req.query.type === 'year') {
      const record = await retrieveTypeYearAttendance(id, { page, limit, sort });
      const count = record.count;
      return ApiResponse.success(res, {
        statusCode: 200,
        message: ' the attendance that you asked for ',
        data: record.parsed,
        meta: { page, limit, count, total: Math.ceil(count / limit) },
      });
    }
    throw new ApiError(400, 'Enter a valid type for retrieving records like week , month , year');
  } else {
    throw new ApiError(
      400,
      'Either you give the type of retriving or you give both start Date and end Date',
    );
  }
};
