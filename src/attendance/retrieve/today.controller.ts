import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { timeDifference } from '../../libs/utils/time-difference.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import z from 'zod';

export const todayAttendanceController = async (req: Request, res: Response) => {
  const userRole = req.user?.role;
  if (userRole === 'user') throw new ApiError(400, 'Only admins and managers are permitted');
  const now = new Date();
  const today = await Attendance.find({ date: standardDateString(now) }).lean();

  const AttendanceFinalSchema = z
    .object({
      id: z.string(),
      user: z.string(),
      inTime: z.string(),
      outTime: z.string(),
      date: z.string(),
      status: z.string(),
      workHours: z.number(),
      isLate: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .readonly();

  type AttendanceT = z.infer<typeof AttendanceFinalSchema>;
  if (!today) throw new ApiError(404, 'Today Attendance Not Found.');

  const updatedToday = today.map((record) => {
    let workHours = record.workHours;

    if (record.inTime && !record.outTime) {
      workHours = Number(timeDifference(record?.inTime as Date, now).hours.toFixed(3));
    }
    return { ...record, workHours };
  });

  return res.status(200).json({ success: true, message: 'Today Attendance.', data: updatedToday });
};
