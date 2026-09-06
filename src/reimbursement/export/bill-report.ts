import crypto from 'node:crypto';

import { Queue } from 'bullmq';
import type { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';
import z from 'zod';

import { Bill, billStatus } from '../../database/bill.model.js';
import { objectId } from '../../libs/utils/zod-object-id.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { bullmqConnection } from '../../libs/redis/redis-client.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { istDayRange } from '../../libs/utils/date-time.js';

export const billReportQueue = new Queue('pdf-bill-report', {
  connection: bullmqConnection,
});

export const billReportQuerySchema = z.object({
  user: objectId().optional(),
  status: z.enum(billStatus).optional(),
  // export a single bill's record by id
  bill: objectId().optional(),
  // inclusive IST day windows
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(['pdf', 'xlsx']).default('pdf'),
});

export const exportBillReportController = async (req: Request, res: Response) => {
  const parsed = billReportQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, z.prettifyError(parsed.error));
  const { user, status, bill, from, to, format } = parsed.data;

  const query: QueryFilter<typeof Bill.schema.obj> = { isDeleted: false };
  if (user) query.user = user;
  if (status) query.status = status;
  if (bill) query._id = bill;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = istDayRange(from)[0];
    if (to) query.date.$lte = istDayRange(to)[1];
  }

  // empty result short-circuits — no job, nothing to download
  const matchCount = await Bill.countDocuments(query);
  if (matchCount === 0) {
    return ApiResponse.success(res, {
      message: 'No bills match the given filters',
      data: null,
      statusCode: 200,
    });
  }

  const key = createKey(
    'reimbursement',
    'bill-report',
    format,
    req.user?.id as string,
    user ?? 'all',
    status ?? 'any',
    bill ?? 'all',
    from ?? 'start',
    to ?? 'end',
  );
  const existingJobId = await getCache<string>(key);

  if (existingJobId) {
    const job = await billReportQueue.getJob(existingJobId);

    if (!job) {
      await deleteCache(key);
    } else {
      const state = await job.getState();

      if (state !== 'completed') {
        return ApiResponse.success(res, {
          message: 'request is processing',
        });
      }

      return ApiResponse.success(res, {
        message: 'report already generated, please check notifications',
      });
    }
  }

  const jobId = crypto.randomUUID();
  await setCache(key, jobId, 86400);

  await billReportQueue.add(
    'pdf-bill-report',
    { query, user: req.user?.id, format },
    { jobId },
  );

  return ApiResponse.success(res, {
    message: 'Bill Report Generation Request Successful, check notifications for download.',
    data: { jobId, format, count: matchCount },
    statusCode: 200,
  });
};
