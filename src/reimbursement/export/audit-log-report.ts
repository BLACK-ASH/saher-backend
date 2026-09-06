import crypto from 'node:crypto';

import { Queue } from 'bullmq';
import type { Request, Response } from 'express';
import z from 'zod';

import { AuditLog } from '../../database/audit-log.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { bullmqConnection } from '../../libs/redis/redis-client.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';

export const auditLogReportQueue = new Queue('pdf-audit-log-report', {
  connection: bullmqConnection,
});

export const auditLogReportQuerySchema = z.object({
  format: z.enum(['pdf', 'xlsx']).default('pdf'),
});

export const exportAuditLogReportController = async (req: Request, res: Response) => {
  const parsed = auditLogReportQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, z.prettifyError(parsed.error));
  const { format } = parsed.data;

  const count = await AuditLog.countDocuments();
  if (count === 0) {
    return ApiResponse.success(res, {
      message: 'No audit entries to export',
      data: null,
      statusCode: 200,
    });
  }

  const key = createKey('reimbursement', 'audit-log-report', format, req.user?.id as string);
  const existingJobId = await getCache<string>(key);

  if (existingJobId) {
    const job = await auditLogReportQueue.getJob(existingJobId);

    if (!job) {
      await deleteCache(key);
    } else {
      const state = await job.getState();

      if (state !== 'completed') {
        return ApiResponse.success(res, {
          message: 'request is processing',
        });
      }

      // Append-only ledger never mutates rows, so the stored file is stale only
      // when new entries arrived since the job ran.
      if (job.data.count === count) {
        return ApiResponse.success(res, {
          message: 'report already generated, please check notifications',
        });
      }

      await deleteCache(key);
    }
  }

  const jobId = crypto.randomUUID();
  await setCache(key, jobId, 86400);

  await auditLogReportQueue.add(
    'pdf-audit-log-report',
    { count, user: req.user?.id, format },
    { jobId },
  );

  return ApiResponse.success(res, {
    message: 'Audit Log Report Generation Request Successful, check notifications for download.',
    data: { jobId, format, count },
    statusCode: 200,
  });
};