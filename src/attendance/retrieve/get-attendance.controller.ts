import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import z from 'zod';
import { AttendanceResponseSchema } from '../attendance.schema.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

const AttendanceByIdSchema = AttendanceResponseSchema.extend({
  user: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  }),
});

export const getAttendanceById = async (req: Request, res: Response) => {
  const id = req.params.id;
  const request = await Attendance.findById(id).populate('user', 'name role').lean();
  if (!request) throw new ApiError(404, 'Attendance Not Found.');

  const normalized = normalizeDoc(request);
  const parsed = AttendanceByIdSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Attendance Retrieve Successful.',
    data: parsed,
    statusCode: 200,
  });
};
