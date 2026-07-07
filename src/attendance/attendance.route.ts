import { Router } from 'express';

import {
  getAllAttendanceCorrectionController,
  getAttendanceCorrectionController,
} from './correction/correction.controller.js';
import {
  attendanceCorrectionSchema,
  attendanceCorrectionHandleSchema,
} from './correction/correction.schema.js';
import { createAttendanceCorrectionController } from './correction/create-correction.js';
import { handleAttendanceCorrectionController } from './correction/handle-correction.js';
import { autoCheckoutCron } from './cron-job/auto-checkout-attendance.cron.js';
import { createAttendanceCron } from './cron-job/create-attendance.cron.js';
import { downloadReportController } from './export/report-download.js';
import { exportReportController } from './export/report.js';
import {
  updateHolidayController,
  getAllHolidayController,
  getHolidayController,
  deleteHolidayController,
  addHolidayController,
} from './holiday/holiday.controller.js';
import { checkInController } from './mark/check-in.controller.js';
import { checkOutController } from './mark/check-out.controller.js';
import { rejectMarkController, rejectMarkSchema } from './mark/reject-mark.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';
import { holidaySchema, holidayUpdateSchema } from './holiday/holiday.schema.js';
import { claimFlexibleWeekOffController } from './mark/week-off.controller.js';
import { allAttendanceController } from './retrieve/all-attendance.controller.js';
import { getAllUserController } from './retrieve/get-all-user.controller.js';
import { getAttendanceById } from './retrieve/get-attendance.controller.js';
import { meAttendanceController } from './retrieve/me.controller.js';
import { retrieveAttendanceController } from './retrieve/retrieve-attendance.controller.js';
import { todayAttendanceController } from './retrieve/today.controller.js';

const attendanceRouter = Router();

// Attendance
attendanceRouter.get('/me', meAttendanceController);
attendanceRouter.get('/today', todayAttendanceController);
attendanceRouter.post('/check-in', checkInController);
attendanceRouter.post('/check-out', checkOutController);
attendanceRouter.get('/retrieve/:id', retrieveAttendanceController);
attendanceRouter.get('/retrieve-all', getAllUserController);
attendanceRouter.get('/user/:id', allAttendanceController);
attendanceRouter.patch('/', validate(rejectMarkSchema), rejectMarkController);

// Export
attendanceRouter.get('/export/report', exportReportController);
attendanceRouter.get('/download/:fileName', downloadReportController);

// Attendance correction
attendanceRouter.get('/record/:id', getAttendanceById);
attendanceRouter.get('/correction/:id', getAttendanceCorrectionController);
attendanceRouter.get('/admin/correction', getAllAttendanceCorrectionController);
attendanceRouter.post(
  '/correction',
  authorize('write', 'attendance-correction'),
  validate(attendanceCorrectionSchema),
  createAttendanceCorrectionController,
);
attendanceRouter.put(
  '/correction/:id',
  authorize('update', 'attendance-correction'),
  validate(attendanceCorrectionHandleSchema),
  handleAttendanceCorrectionController,
);

// Holiday Routes
attendanceRouter.get('/holiday', getAllHolidayController);
attendanceRouter.get('/holiday/:id', getHolidayController);
attendanceRouter.delete('/holiday/:id', authorize('delete', 'holiday'), deleteHolidayController);
attendanceRouter.post(
  '/holiday',
  authorize('write', 'holiday'),
  validate(holidaySchema),
  addHolidayController,
);
attendanceRouter.put(
  '/holiday/:id',
  authorize('update', 'holiday'),
  validate(holidayUpdateSchema),
  updateHolidayController,
);

attendanceRouter.post('/claim/weekoff', claimFlexibleWeekOffController);

// WARN: Do Not Change This Part
// Cron Jobs
attendanceRouter.post('/cron/create/:pass', createAttendanceCron);
attendanceRouter.post('/cron/auto-checkout/:pass', autoCheckoutCron);

export default attendanceRouter;
