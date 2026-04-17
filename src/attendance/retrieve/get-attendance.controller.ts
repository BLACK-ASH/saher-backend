import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';

export const getAttendanceById = async (req: Request, res: Response) => {
  const id = req.params.id;
  const request = await Attendance.findById(id).populate('user', 'name role').lean();
  if (!request) throw new ApiError(404, 'Attendance Not Found.');
  return res
    .status(200)
    .json({ success: true, message: 'Attendance Retrieve Successful.', data: request });
};
