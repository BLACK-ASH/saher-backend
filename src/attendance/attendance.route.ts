import { Router } from 'express';
import { checkInController } from './mark/check-in.controller.js';
import { checkOutController } from './mark/check-out.controller.js';
import {
  updateHolidayController,
  getAllHolidayController,
  getHolidayController,
  deleteHolidayController,
  addHolidayController,
} from './holiday/holiday.controller.js';
import { authorize } from '../permission/authorize.js';
import { holidaySchema, holidayUpdateSchema } from './holiday/holiday.schema.js';
import {
  attendanceCorrectionSchema,
  attendanceCorrectionHandleSchema,
} from './correction/correction.schema.js';
import {
  getAllAttendanceCorrectionController,
  getAttendanceCorrectionById,
  getAttendanceCorrectionController,
} from './correction/correction.controller.js';
import { createAttendanceCorrectionController } from './correction/create-correction.js';
import { handleAttendanceCorrectionController } from './correction/handle-correction.js';
import { todayAttendanceController } from './retrieve/today.controller.js';
import { meAttendanceController } from './retrieve/me.controller.js';
import { getAllUserController } from './retrieve/get-all-user.controller.js';
import { retrieveAttendanceController } from './retrieve/retrieve-attendance.controller.js';
import { createAttendanceCron } from './cron-job/create-attendance.cron.js';
import { autoCheckoutCron } from './cron-job/auto-checkout-attendance.cron.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { getAttendanceById } from './retrieve/get-attendance.controller.js';

const attendanceRouter = Router();

// TODO:Implement the Route in the following structured
// method:GET path: /me function: current user status
// method:GET path: /today function: all user status
// method:POST path: /check-in function: to check in
// method:POST path: /check-out function: to check out
// method:GET path: /(:id/me) function: get all attendance records acc to user-id/me with pagination
// method:GET path: /record function: get all attendance records all users with pagination
// method:GET path: /record/:id function: get specific attendance record by attendance id
// Leave The Retrieve as like before

attendanceRouter.get('/me', meAttendanceController);
attendanceRouter.get('/today', todayAttendanceController);
attendanceRouter.post('/check-in', checkInController);
attendanceRouter.post('/check-out', checkOutController);
attendanceRouter.get('/retrieve/:id', retrieveAttendanceController);
attendanceRouter.get('/retrieve-all', getAllUserController);

// Attendance
attendanceRouter.get('/attendance/:id', getAttendanceById);

// Attendance Correction Route
// TODO:Implement the Route in the following structured
// method:GET path: /correction/(:id/me) function: get all correction record acc to user-id/me with pagination
// method:GET path: /admin/correction function: get all users correction record
// method:POST path: /correction function: create correction record
// method:PUT path: /correction/:id function: handle attendance correction

attendanceRouter.get('/attendance-correction', getAttendanceCorrectionController);
attendanceRouter.get('/attendance-correction/:id', getAttendanceCorrectionById);
attendanceRouter.get('/attendance-correction-all', getAllAttendanceCorrectionController);
attendanceRouter.post(
  '/attendance-correction',
  authorize('write', 'attendance-correction'),
  validate(attendanceCorrectionSchema),
  createAttendanceCorrectionController,
);
attendanceRouter.put(
  '/attendance-correction/:id',
  authorize('update', 'attendance-correction'),
  validate(attendanceCorrectionHandleSchema),
  handleAttendanceCorrectionController,
);

// TODO:Implement the Route in the following structured
// method:GET path: /holiday function: get all holiday
// method:GET path: /holiday/:id function: get specific holiday
// method:POST path: /holiday/:id function: create holiday
// method:PUT path: /holiday/:id function: update holiday
// method:DELETE path: /holiday/:id function: delete holiday

attendanceRouter.get('/holiday/get-all', getAllHolidayController);
attendanceRouter.get('/holiday/get/:id', getHolidayController);
attendanceRouter.delete(
  '/holiday/delete/:id',
  authorize('delete', 'holiday'),
  deleteHolidayController,
);

// Holiday Routes
attendanceRouter.post(
  '/holiday/create',
  authorize('write', 'holiday'),
  validate(holidaySchema),
  addHolidayController,
);
attendanceRouter.put(
  '/holiday/update/:id',
  authorize('update', 'holiday'),
  validate(holidayUpdateSchema),
  updateHolidayController,
);

// WARN: Do Not Change This Part
// Cron Jobs
attendanceRouter.post('/cron/create/:pass', createAttendanceCron);
attendanceRouter.post('/cron/auto-checkout/:pass', autoCheckoutCron);

export default attendanceRouter;
