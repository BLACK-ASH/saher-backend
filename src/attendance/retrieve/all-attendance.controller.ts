import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { AttendanceResponseSchema } from './me.controller.js';
import z from 'zod';
import { ApiResponse } from '../../libs/class/api-response.js';

const AttendanceAllSchema = z.array(AttendanceResponseSchema.omit({ user: true }).readonly());
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
  const limit = Number(req.query.limit) || 1;
  const skip = (page - 1) * limit;

  const record = await Attendance.find({ user: id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalRecord = await Attendance.countDocuments({ user: id });

  const normalized = normalizeDoc(record);
  const parsed = AttendanceAllSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'All Attendance ',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, totalRecord, totalPages: Math.ceil(totalRecord / limit) },
  });
};
