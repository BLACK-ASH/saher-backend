import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const meAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;
  const today = await Attendance.findOne({
    user: user?.id,
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
  }).lean();

  if (!today) throw new ApiError(404, 'Today Attendance Not Found.');

  return ApiResponse.success(res, {
    message: 'Today Attendance.',
    data: today,
    statusCode: 200,
  });
};
