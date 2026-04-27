import { Request, Response } from 'express';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { CorrectionResponseSchema } from './correction.schema.js';
import z from 'zod';

export const getAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user;

  let userID;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

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
    .skip(skip)
    .limit(limit)
    .lean();

  const normalize = normalizeDoc(requests);
  const parsed = z.array(CorrectionResponseSchema).parse(normalize);
  const count = await AttendanceCorrection.countDocuments({ user: userID });
  return ApiResponse.success(res, {
    message: 'Attendance Correction Retrieve Successful.',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
  });
};

// export const getAttendanceCorrectionById = async (req: Request, res: Response) => {
//   const id = req.params.id;
//   const request = await AttendanceCorrection.findById(id)
//     .populate('user manager', 'name role')
//     .populate('attendance', 'date')
//     .populate('proof', 'src alt')
//     .lean();
//   if (!request) throw new ApiError(404, 'Attendance Correction Request Not Found.');
//   return ApiResponse.success(res, {
//     message: 'Attendance Correction Retrieve Successful.',
//     data: request,
//     statusCode: 200,
//   });
// };

const getAllAttendanceCorrectionSchema = z.array(
  CorrectionResponseSchema.omit({ createdAt: true, updatedAt: true }),
);
export const getAllAttendanceCorrectionController = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const requests = await AttendanceCorrection.find()
    .populate('user manager', 'name role')
    .populate('attendance', 'date')
    .populate('proof')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const normalize = normalizeDoc(requests);
  const parsed = getAllAttendanceCorrectionSchema.parse(normalize);

  const count = await AttendanceCorrection.countDocuments();

  return ApiResponse.success(res, {
    message: 'Attendance Correction Retrieve Successful.',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
  });
};
