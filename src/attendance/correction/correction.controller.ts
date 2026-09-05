import type { Request, Response } from 'express';

import type { AttendanceCorrectionResponse } from './correction.schema.js';
import { correctionResponsListSchema } from './correction.schema.js';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCacheWithGroup } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

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

  const key = createKey('attendance', 'correction', id, limit, page, sort);
  const cache = await getCache<{
    message: string;
    data: AttendanceCorrectionResponse[];
    meta: { total: number; page: number; count: number; limit: number };
  }>(key);

  if (cache) return ApiResponse.success(res, cache);

  const requests = await AttendanceCorrection.find({ user: id })
    .populate({
      path: 'user manager',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .populate('attendance', 'date')
    .populate('proof', 'src alt')
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const normalize = normalizeDoc(requests);

  // Legacy/edge records can carry `proof` as a bare ObjectId (media deleted, so
  // populate left it unresolved) or null — drop it so the response schema's
  // `{id,src,alt}` stays valid instead of 500ing the whole list.
  const sanitized = (normalize as AttendanceCorrectionResponse[]).map((row) => {
    if (typeof row.proof === 'string' || row.proof === null) delete row.proof;
    return row;
  });

  const parsed = correctionResponsListSchema.parse(sanitized);
  const count = await AttendanceCorrection.countDocuments({ user: id });

  const body = {
    message: 'Attendance Correction Retrieve Successful.',
    data: parsed,
    meta: { page, limit, count, total: Math.ceil(count / limit) },
  };

  await setCacheWithGroup(key, body, ['attendance', 'correction']);

  return ApiResponse.success(res, body);
};

export const getAllAttendanceCorrectionController = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort === 'asc' ? 'asc' : 'desc';
  const key = createKey('attendance', 'correction', 'list', limit, page, sort);

  const cache = await getCache<{
    message: string;
    data: AttendanceCorrectionResponse[];
    meta: { total: number; page: number; count: number; limit: number };
  }>(key);

  if (cache) return ApiResponse.success(res, cache);

  const requests = await AttendanceCorrection.find()
    .populate({
      path: 'user manager',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .populate('attendance', 'date')
    .populate('proof')
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const normalize = normalizeDoc(requests);

  // Legacy/edge records can carry `proof` as a bare ObjectId (media deleted, so
  // populate left it unresolved) or null — drop it so the response schema's
  // `{id,src,alt}` stays valid instead of 500ing the whole list.
  const sanitized = (normalize as AttendanceCorrectionResponse[]).map((row) => {
    if (typeof row.proof === 'string' || row.proof === null) delete row.proof;
    return row;
  });

  const parsed = correctionResponsListSchema.parse(sanitized);
  const count = await AttendanceCorrection.countDocuments();

  const body = {
    message: 'Attendance Correction Retrieve Successful.',
    data: parsed,
    meta: { page, limit, count, total: Math.ceil(count / limit) },
  };

  await setCacheWithGroup(key, body, ['attendance', 'correction']);

  return ApiResponse.success(res, body);
};
