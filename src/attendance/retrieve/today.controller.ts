import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const todayAttendanceController = async (req: Request, res: Response) => {
  const today = await Attendance.find().lean();

  if (!today) throw new ApiError(404, 'Today Attendance Not Found.');

  return ApiResponse.success(res, {
    message: 'Today Attendance.',
    data: today,
    statusCode: 200,
  });
};
