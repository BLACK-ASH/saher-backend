import type { Request, Response } from 'express';

import { attendanceListSchema } from './attendance.schema.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const allAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;
  let id;
  // Get the user body
  if (req.params.id === 'me' || req.params.id === user?.id) {
    id = user?.id;
  } else if (user?.role === 'admin' || user?.role === 'manager') {
    id = req.params.id;
  } else {
    throw new ApiError(403, 'Forbidden');
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { user: id };
  if (req.query.startDate && req.query.endDate) {
    filter.date = {
      $gte: standardDateString(String(req.query.startDate)),
      $lte: standardDateString(String(req.query.endDate)),
    };
  }

  const query = Attendance.find(filter)
    .populate('user', 'name email role ')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    });

  if (req.query.startDate) {
    query.sort({ date: 1 });
  } else {
    query.sort({ createdAt: -1 });
  }

  const record = await query.skip(skip).limit(limit).lean();

  const count = await Attendance.countDocuments(filter);

  const normalized = normalizeDoc(record);
  const parsed = attendanceListSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'All Attendance ',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, total: Math.ceil(count / limit) },
  });
};
