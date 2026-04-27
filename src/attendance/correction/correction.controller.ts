import { Request, Response } from 'express';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { correctionResponsListSchema } from './correction.schema.js';

export const getAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden: User Not Allowed.');

  const userID = req.params.id as string;

  if (!userID) {
    throw new ApiError(400, 'User ID param is required');
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort === 'asc' ? 'asc' : 'desc';

  let id: string;

  if (userID === 'me') {
    id = user.id;
  } else {
    if (user.role === 'user') {
      throw new ApiError(403, 'Forbidden: Action Not Allowed.');
    }
    id = userID;
  }

  const requests = await AttendanceCorrection.find({ user: id })
    .populate('user manager', 'name role')
    .populate('attendance', 'date')
    .populate('proof', 'src alt')
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const normalize = normalizeDoc(requests);
  const parsed = correctionResponsListSchema.parse(normalize);
  const count = await AttendanceCorrection.countDocuments({ user: id });

  return ApiResponse.success(res, {
    message: 'Attendance Correction Retrieve Successful.',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, total: Math.ceil(count / limit) },
  });
};

export const getAllAttendanceCorrectionController = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort === 'asc' ? 'asc' : 'desc';

  const requests = await AttendanceCorrection.find()
    .populate('user manager', 'name role')
    .populate('attendance', 'date')
    .populate('proof')
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const normalize = normalizeDoc(requests);
  const parsed = correctionResponsListSchema.parse(normalize);
  const count = await AttendanceCorrection.countDocuments();

  return ApiResponse.success(res, {
    message: 'Attendance Correction Retrieve Successful.',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, total: Math.ceil(count / limit) },
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
