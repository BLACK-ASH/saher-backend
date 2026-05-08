import type { Request, Response } from 'express';
import z from 'zod';

import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { logger } from '../../libs/logger/logger.js';
import { createKey, deleteCache, deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { attendanceResponseSchema } from '../retrieve/attendance.schema.js';

export const rejectMarkSchema = z.object({
  id: z.string(),
  status: z.enum(['present', 'absent', 'half-day']),
  isLate: z.boolean(),
  date: z.string(),
});

export type RejectMarkT = z.infer<typeof rejectMarkSchema>;

export const rejectMarkController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden');

  const role = user.role;
  if (role === 'user') throw new ApiError(400, 'Only Admins and Manager Are Permitted');

  const input: RejectMarkT = req.body;

  const date = standardDateString(new Date(input.date));

  const record = await Attendance.findOne({ user: input.id, date: date })
    .populate('user', ' name role email ')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    });

  if (!record) throw new ApiError(400, 'The attendance for  user on the given date not found');

  record.status = input.status;
  record.isLate = input.isLate;
  await record.save();

  // if today attendance is updated
  const today = standardDateString(new Date());
  if (today === date) {
    const todayKey = createKey('attendance', 'today', 'me', user.id);
    await deleteCache(todayKey);
    await deleteCacheGroup('attendance', 'today', 'list');
  }

  const normalized = normalizeDoc(record.toObject());
  const parsed = attendanceResponseSchema.parse(normalized);
  const body = {
    message: 'The data has been update',
    data: parsed,
  };

  logger.info({ data: body.data }, 'the record that was update is');

  return ApiResponse.success(res, body);
};
