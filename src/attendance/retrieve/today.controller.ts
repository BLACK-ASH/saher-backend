import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';

export const todayAttendanceController = async (req: Request, res: Response) => {
  const today = await Attendance.find().lean();

  if (!today) throw new ApiError(404, 'Today Attendance Not Found.');

  return res.status(200).json({ success: true, message: 'Today Attendance.', data: today });
};
