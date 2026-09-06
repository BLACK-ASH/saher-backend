import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';

import { Queue } from 'bullmq';
import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

import type { SessionType } from '../../database/session.model.js';
import { Session } from '../../database/session.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { bullmqConnection } from '../../libs/redis/redis-client.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { notification } from '../../libs/utils/notification.js';
import { isReportStale } from '../../libs/utils/report-stale.js';

export const sessionReportQueue = new Queue('pdf-session-report', {
  connection: bullmqConnection,
});

const fetchSessionForJob = async (sessionId: string): Promise<HydratedDocument<SessionType>> => {
  const session = await Session.findOne({ _id: sessionId, isDeleted: false })
    .populate('program', 'title')
    .populate('workshop', 'title')
    .populate({
      path: 'participants',
      populate: { path: 'image document' },
    })
    .populate('speaker', 'name email role');

  if (!session) throw new Error(`Session ${sessionId} not found for report`);

  return session;
};

export const sessionReportWorkerHandler = async (job: {
  id?: string;
  data: { sessionId: string; user: string; format: 'pdf' | 'xlsx' };
}) => {
  const session = await fetchSessionForJob(job.data.sessionId);

  const ext = job.data.format === 'xlsx' ? 'xlsx' : 'pdf';
  // worker writes to public/temp/${job.id}.${ext} and notifies with download action
  const url = `/api/attendance/download/${String(job.id)}.${ext}`;

  const action = {
    type: 'download' as const,
    label: 'Report',
    url,
    method: 'GET' as const,
  };

  await notification.specific.info(
    [job.data.user],
    `session report generated - ${String(session.get('title'))}`,
    'Your session report is ready to download.',
    action,
  );

  return { downloadPath: url };
};

export const exportSessionReportController = async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const format = req.query.format === 'xlsx' ? 'xlsx' : 'pdf';

  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    throw new ApiError(400, 'Valid sessionId query parameter is required');
  }

  const session = await Session.findOne({ _id: sessionId, isDeleted: false }).select('_id');
  if (!session) throw new ApiError(404, 'Session not found');

  const key = createKey('events', 'session-report', format, req.user?.id as string, String(sessionId));
  const existingJobId = await getCache<string>(key);

  if (existingJobId) {
    const job = await sessionReportQueue.getJob(existingJobId);

    if (!job) {
      await deleteCache(key);
    } else {
      const state = await job.getState();

      if (state === 'failed') {
        // A failed job would otherwise poison the dedupe cache and block all
        // future exports for this session+user+format until the 24h TTL.
        await deleteCache(key);
      } else if (state !== 'completed') {
        return ApiResponse.success(res, {
          message: 'request is processing',
        });
      } else {
        // Completed — reuse only if the artifact is servable AND nothing in
        // scope changed since the job finished; otherwise regenerate.
        const fileName = `${existingJobId}.${format}`;
        const reportPath = path.join(process.cwd(), 'public', 'temp', fileName);
        const completedAt = new Date(job.finishedOn ?? Date.now());
        const stale = await isReportStale(Session, { _id: sessionId }, completedAt);
        if (fs.existsSync(reportPath) && !stale) {
          return ApiResponse.success(res, {
            message: 'report already generated, please check notifications',
          });
        }
        await deleteCache(key);
      }
    }
  }

  const jobId = crypto.randomUUID();
  await setCache(key, jobId, 86400);

  await sessionReportQueue.add(
    'pdf-session-report',
    { sessionId, user: req.user?.id, format },
    { jobId },
  );

  return ApiResponse.success(res, {
    message: 'Session Report Generation Request Successful, check notifications for download.',
    data: { jobId, format },
    statusCode: 200,
  });
};
