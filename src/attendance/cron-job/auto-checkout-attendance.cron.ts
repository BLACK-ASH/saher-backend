import type { Request, Response } from 'express';

import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { timeDifference } from '../../libs/utils/time-difference.js';
import 'dotenv/config';
import { deleteCacheGroup } from '../../libs/redis/redis-utils.js';

export const autoCheckoutCron = async (req: Request, res: Response) => {
  const pass = req.params?.pass;

  // 🔐 Basic protection (use ENV in production)
  if (pass !== process.env.CRON_SECRET) {
    throw new ApiError(403, 'Forbidden. You are not allowed to perform this action.');
  }

  // 📅 Today (same format you are using)
  const today = standardDateString(new Date());

  // 🕕 Default checkout time (6 PM IST)
  const now = new Date();

  // Get IST date parts
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  // Create 6 PM IST in UTC
  const defaultOutTime = new Date(Date.UTC(year, month - 1, day, 12, 30, 0));
  // 18:00 IST = 12:30 UTC

  // 🔍 Find users who checked in but not checked out
  const records = await Attendance.find({
    date: today,
    inTime: { $ne: null },
    outTime: null,
  }).lean();

  if (!records.length) {
    return ApiResponse.success(res, {
      message: 'No pending auto checkouts.',
      data: { updated: 0 },
      statusCode: 200,
    });
  }

  // ⚡ Prepare bulk updates
  const bulkOps = records.map((record) => {
    const inTime = new Date(record.inTime as Date);

    // ⏱ Calculate work hours
    const workHours = timeDifference(defaultOutTime, inTime).hours;

    // 📊 Decide status
    const status = workHours < 5 ? 'half-day' : 'present';

    return {
      updateOne: {
        filter: { _id: record._id },
        update: {
          $set: {
            outTime: defaultOutTime,
            workHours,
            status,
            autoCheckout: true, // 👈 important flag
          },
        },
      },
    };
  });

  // 🚀 Execute bulk update
  await Attendance.bulkWrite(bulkOps);

  await deleteCacheGroup('today');

  return ApiResponse.success(res, {
    message: 'Auto checkout completed successfully.',
    data: {
      updated: bulkOps.length,
    },
    statusCode: 200,
  });
};
