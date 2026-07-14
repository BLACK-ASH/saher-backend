import { Temporal } from '@js-temporal/polyfill';
import type { Request, Response } from 'express';
import z from 'zod';

import { accountSchemaFinal } from '../../admin/_services/account.js';
import { Account } from '../../database/account.model.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import 'dotenv/config';
import {
  calculateWorkStatus,
  getShift,
  setShiftHour,
  workHourData,
} from '../../libs/utils/calculate-work-status.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const autoCheckoutCron = async (req: Request, res: Response) => {
  const pass = req.params?.pass;

  if (pass !== process.env.CRON_SECRET && req.user?.role !== 'admin') {
    throw new ApiError(403, 'Forbidden. You are not allowed to perform this action.');
  }

  const today = standardDateString(new Date());

  // 🔍 Find pending records
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

  // ✅ 1. Fetch all accounts in ONE query (NO Redis, NO N+1)
  const userIds = records.map((r) => r.user);

  const accounts = await Account.find({
    user: { $in: userIds },
  })
    .populate('bank aadhar pan resume')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .lean();

  if (!accounts) return null;

  const normalize = normalizeDoc(accounts);
  const parsed = z.array(accountSchemaFinal).parse(normalize);

  // ✅ 2. Build O(1) lookup
  const accountMap = new Map(parsed.map((acc) => [acc.user.id.toString(), acc]));

  // ✅ 3. Build bulk operations (sync loop = faster)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bulkOps: any[] = [];

  for (const record of records) {
    const account = accountMap.get(record.user.toString());
    if (!account) continue;

    const shift = getShift(account);
    const shiftData = workHourData.get(shift);
    if (!shiftData) continue;

    // const inDate = new Date(record.inTime as Date);

    // // ✅ IST shift → UTC
    // const outTime = setShiftTimeUTC(inDate, shiftData.out);

    const instant = Temporal.Instant.from(new Date(record.inTime as Date).toISOString());

    const zonedDateTime = instant.toZonedDateTimeISO('Asia/Kolkata');

    const outZonedDateTime = setShiftHour(zonedDateTime, shiftData.out);

    const outTime = new Date(outZonedDateTime.toInstant().epochMilliseconds);

    const { workHours, status } = calculateWorkStatus({
      inTime: record.inTime as Date,
      outTime,
      shift,
    });

    bulkOps.push({
      updateOne: {
        filter: { _id: record._id },
        update: {
          $set: {
            outTime,
            workHours,
            status,
            autoCheckout: true,
          },
        },
      },
    });
  }

  // ✅ 4. Chunked bulkWrite (safe for large scale)
  const CHUNK_SIZE = 1000;

  for (let i = 0; i < bulkOps.length; i += CHUNK_SIZE) {
    await Attendance.bulkWrite(bulkOps.slice(i, i + CHUNK_SIZE));
  }

  await deleteCacheGroup('today');

  return ApiResponse.success(res, {
    message: 'Auto checkout completed successfully.',
    data: {
      updated: bulkOps.length,
    },
    statusCode: 200,
  });
};
