import { Request, Response } from 'express';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { ApiError } from '../../libs/class/api-error.js';

export const getAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user;

  let userID;

  if (user?.role === 'user') {
    userID = user?.id;
  } else if (user?.role === 'admin' || user?.role === 'manager') {
    const id = req.params.id;
    if (!id) throw new ApiError(400, 'Params is required');

    userID = id === 'me' ? user?.id : id;
  } else {
    throw new ApiError(403, 'Forbidden');
  }
  const requests = await AttendanceCorrection.find({ user: userID })
    .populate('user', 'name role')
    .populate('attendance', 'date')
    .populate('proof', 'src alt')
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json({ success: true, message: 'Attendance Correction Retrieve Successful.', data: requests });
};

// export const getAttendanceCorrectionById = async (req: Request, res: Response) => {
//   const id = req.params.id;
//   const request = await AttendanceCorrection.findById(id)
//     .populate('user manager', 'name role')
//     .populate('attendance', 'date')
//     .populate('proof', 'src alt')
//     .lean();
//   if (!request) throw new ApiError(404, 'Attendance Correction Request Not Found.');
//   return res
//     .status(200)
//     .json({ success: true, message: 'Attendance Correction Retrieve Successful.', data: request });
// };

export const getAllAttendanceCorrectionController = async (req: Request, res: Response) => {
  const requests = await AttendanceCorrection.find()
    .populate('user manager', 'name role')
    .populate('attendance', 'date')
    .populate('proof')
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json({ success: true, message: 'Attendance Correction Retrieve Successful.', data: requests });
};
