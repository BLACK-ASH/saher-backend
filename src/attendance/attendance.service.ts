import z from 'zod';

import { Attendance } from '../database/attendance.model.js';
import { attendanceResponseSchema } from './retrieve/attendance.schema.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';
import { standardDateString } from '../libs/utils/standard-date.js';

export const retrieveCustomAttendace = async (
  user: string,
  startDate: string,
  endDate: string,
  { page = 1, limit = 10, sort = 'asc' }: { page: number; limit: number; sort: string },
) => {
  const skip = (page - 1) * limit;
  const finalSort = sort === 'asc' ? 1 : sort === 'desc' ? -1 : -1; // default

  const record = await Attendance.find({
    user: user,
    date: {
      $gte: standardDateString(startDate),
      $lte: standardDateString(endDate),
    },
  })
    .sort({ finalSort })
    .skip(skip)
    .populate('user', 'name email role ')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .limit(limit)
    .lean();

  const normalized = normalizeDoc(record);
  const parsed = z.array(attendanceResponseSchema).parse(normalized);
  return parsed;
};

export const retrieveTypeTodayAttendance = async (user: string) => {
  const today = standardDateString(new Date());

  const record = await Attendance.findOne({ user: user, date: today })
    .populate('user', 'name email role')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .lean();

  const normalized = normalizeDoc(record);
  const parsed = attendanceResponseSchema.parse(normalized);

  return parsed;
};

export const retrieveTypeWeekAttendance = async (
  user: string,
  { page = 1, limit = 10, sort = 'asc' }: { page?: number; limit?: number; sort?: string },
) => {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 6);
  const endDate = standardDateString(today);
  const startDate = standardDateString(start);

  const record = retrieveCustomAttendace(user, startDate, endDate, { page, limit, sort });

  return record;
};

export const retrieveTypeMonthAttendance = async (
  user: string,
  { page = 1, limit = 10, sort = 'asc' }: { page: number; limit: number; sort: string },
) => {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 29);
  const endDate = standardDateString(today);
  const startDate = standardDateString(start);

  const record = retrieveCustomAttendace(user, startDate, endDate, { page, limit, sort });

  return record;
};

export const retrieveTypeYearAttendance = async (
  user: string,
  { page = 1, limit = 10, sort = 'asc' }: { page: number; limit: number; sort: string },
) => {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 364);
  const endDate = standardDateString(today);
  const startDate = standardDateString(start);

  const record = retrieveCustomAttendace(user, startDate, endDate, { page, limit, sort });

  return record;
};
