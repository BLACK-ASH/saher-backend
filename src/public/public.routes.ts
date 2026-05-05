import { Router } from 'express';
import mongoose from 'mongoose';

import { autoCheckoutCron } from '../attendance/cron-job/auto-checkout-attendance.cron.js';
import { createAttendanceCron } from '../attendance/cron-job/create-attendance.cron.js';
import { ApiResponse } from '../libs/class/api-response.js';

const publicRouter = Router();

publicRouter.post('/cron/create/:pass', createAttendanceCron);
publicRouter.post('/cron/auto-checkout/:pass', autoCheckoutCron);

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
