import { Request, Response } from 'express';
import z from 'zod';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const rejectMarkSchema = z.object({
  user: z.string(),
  status: z.enum(['present', 'absent', 'half-day']),
  isLate: z.boolean(),
  date: z.date(),
});

export type RejectMarkT = z.infer<typeof rejectMarkSchema>;

export const rejectMarkController = async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role === 'user') throw new ApiError(400, 'Only Admins and Manager Are Permitted');

  const input: RejectMarkT = req.body;

  const date = standardDateString(new Date(input.date));

  const record = await Attendance.findOne({ user: input.user, date: date });

  if (!record) throw new ApiError(400, 'The attendance for  user on the given date not found');

  record.status = input.status;
  record.isLate = input.isLate;
  await record.save();

  const body = {
    message: 'The data has been update',
    date: record,
  };

  return ApiResponse.success(res, body);
};
