import { Queue, Worker } from 'bullmq';

import { autoCheckoutSync } from '../attendance/cron-job/auto-checkout-attendance.cron.js';
import { createAttendanceSync } from '../attendance/cron-job/create-attendance.cron.js';
import { bullmqConnection } from '../libs/redis/redis-client.js';
import { logger } from '../libs/logger/logger.js';

// Self-scheduled attendance sync so daily attendance seeding + auto-checkout
// run without an external cron hitting the HTTP routes. Registered at worker
// boot (worker/index.ts); both public and legacy HTTP cron routes stay for ops.
export const attendanceCreateQueue = new Queue('attendance-create', {
  connection: bullmqConnection,
});

export const attendanceAutoCheckoutQueue = new Queue('attendance-auto-checkout', {
  connection: bullmqConnection,
});

// IST 00:15 daily — seed attendance rows for the day (CRON.md cadence)
attendanceCreateQueue
  .upsertJobScheduler('attendance-create-daily', {
    pattern: '15 0 * * *',
    tz: 'Asia/Kolkata',
  })
  .catch((err: unknown) => logger.error(err, 'Failed to register attendance create schedule'));

// IST 23:30 daily — finalize any open check-ins at shift end (CRON.md cadence)
attendanceAutoCheckoutQueue
  .upsertJobScheduler('attendance-auto-checkout-daily', {
    pattern: '30 23 * * *',
    tz: 'Asia/Kolkata',
  })
  .catch((err: unknown) => logger.error(err, 'Failed to register attendance auto-checkout schedule'));

export const attendanceCreateWorker = new Worker(
  'attendance-create',
  async () => {
    await createAttendanceSync();
  },
  { connection: bullmqConnection },
);

export const attendanceAutoCheckoutWorker = new Worker(
  'attendance-auto-checkout',
  async () => {
    await autoCheckoutSync();
  },
  { connection: bullmqConnection },
);

attendanceCreateWorker.on('completed', () => logger.info('Attendance create job completed.'));
attendanceCreateWorker.on('failed', (job, err) =>
  logger.error(err, 'Attendance create job failed'),
);
attendanceAutoCheckoutWorker.on('completed', () => logger.info('Attendance auto-checkout job completed.'));
attendanceAutoCheckoutWorker.on('failed', (job, err) =>
  logger.error(err, 'Attendance auto-checkout job failed'),
);