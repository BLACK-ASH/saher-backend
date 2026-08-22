import crypto from 'node:crypto';

import { Queue } from 'bullmq';
import type { Request, Response } from 'express';

import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { DateRange } from '../../libs/class/date-range.js';
import { bullmqConnection } from '../../libs/redis/redis-client.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { notification } from '../../libs/utils/notification.js';

export const attendanceReportQueue = new Queue('pdf-attendance-report', {
  connection: bullmqConnection,
});

export const exportReportController = async (req: Request, res: Response) => {
  const {
    type = 'month',

    includeToday,

    startDate,
    endDate,

    days,
  } = req.query;

  const shouldIncludeToday = String(includeToday).toLowerCase() === 'true';

  let dateRange;

  switch (type) {
    case 'today':
      dateRange = DateRange.today();
      break;

    case 'week':
      dateRange = DateRange.week({
        includeToday: shouldIncludeToday,
      });
      break;

    case 'month':
      dateRange = DateRange.month({
        includeToday: shouldIncludeToday,
      });
      break;

    case 'year':
      dateRange = DateRange.year({
        includeToday: shouldIncludeToday,
      });
      break;

    case 'lastDays':
      dateRange = DateRange.lastDays({
        days: Number(days ?? 7),

        includeToday: shouldIncludeToday,
      });
      break;

    case 'custom':
      if (!startDate) throw new ApiError(400, 'start date is required');

      dateRange = DateRange.custom({
        start: String(startDate),
        end: String(endDate),
      });

      break;

    default:
      throw new ApiError(400, 'Invalid range type');
  }

  const key = createKey(
    'attendance',
    'report',
    'pdf',
    req.user?.id as string,
    dateRange.startDateString,
    dateRange.endDateString,
  );
  const request = await getCache<string>(key);

  if (request) {
    const job = await attendanceReportQueue.getJob(request);
    const data = {
      id: job?.id,
      data: job?.data,
      state: await job?.getState(),
      result: job?.returnvalue,
    };

    if (!data.state || data.state !== 'completed') {
      return ApiResponse.success(res, {
        message: 'request is processing',
      });
    }

    if (job) {
      const action = {
        type: 'download' as const,
        label: 'Report',
        url: data.result.downloadPath,
        method: 'GET' as const,
      };

      await notification.specific.info(
        [job.data.user],
        `attendance report generated, type - ${job.data.type} `,
        `attendance report from ${dateRange.startDateString} - ${dateRange.endDateString}`,
        action,
      );

      return ApiResponse.success(res, {
        message: 'request is already process, please check notifications',
      });
    }

    return ApiResponse.success(res, {
      message: 'request is already process, please check notifications',
    });
  }

  const jobId = crypto.randomUUID();
  await setCache(key, jobId, 86400);

  await attendanceReportQueue.add(
    'pdf-attendance-report',
    { ...dateRange, type, user: req.user?.id },
    {
      jobId,
    },
  );

  return ApiResponse.success(res, {
    message: 'Attendance Report Generation Request Successful, check notifications for download.',

    data: {
      jobId,
      dateRange,
    },

    statusCode: 200,
  });
};
