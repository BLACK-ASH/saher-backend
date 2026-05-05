import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { attendanceListSchema } from './attendance.schema.js';

export const allAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;
  let id;
  // Get the user body
  if (req.params.id === 'me') {
    id = user?.id;
  } else {
    if (user?.role !== 'user') id = req.params.id;
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const record = await Attendance.find({ user: id })
    .populate('user', 'name email role ')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const count = await Attendance.countDocuments({ user: id });

  const normalized = normalizeDoc(record);
  const parsed = attendanceListSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'All Attendance ',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, total: Math.ceil(count / limit) },
  });
};
