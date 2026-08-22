import { Router } from 'express';
import mongoose from 'mongoose';

import { autoCheckoutCron } from '../attendance/cron-job/auto-checkout-attendance.cron.js';
import { createAttendanceCron } from '../attendance/cron-job/create-attendance.cron.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { requireCronSecret } from '../libs/middleware/cron-secret.js';

const publicRouter = Router();

// Secret goes in `Authorization: Bearer <CRON_SECRET>` header, not the URL path.
publicRouter.post('/cron/create-attendance', requireCronSecret, createAttendanceCron);
publicRouter.post('/cron/auto-checkout', requireCronSecret, autoCheckoutCron);

// To Check Services Is Healthy
publicRouter.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  if (dbStatus !== 1) {
    return ApiResponse.success(res, {
      message: 'Server Unhealthy',
      data: undefined,
      statusCode: 500,
    });
  }
  return ApiResponse.success(res, {
    message: 'Server Healthy',
    data: undefined,
    statusCode: 200,
  });
});
export default publicRouter;
