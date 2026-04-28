import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { attendanceResponseSchema } from './attendance.schema.js';

export const getAttendanceById = async (req: Request, res: Response) => {
  const id = req.params.id;
  const request = await Attendance.findById(id).populate('user', 'name email role').lean();
  if (!request) throw new ApiError(404, 'Attendance Not Found.');

  const normalized = normalizeDoc(request);
  const parsed = attendanceResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Attendance Retrieve Successful.',
    data: parsed,
    statusCode: 200,
  });
};
