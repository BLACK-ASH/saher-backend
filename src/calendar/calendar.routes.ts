import { Router } from 'express';

import { createMeetingSchema } from './calendar.schema.js';
import {
  createCalendarEventController,
  deleteCalendarEventController,
  getCalendarEventByMonth,
  syncGoogleHolidaysController,
} from './calender.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

export const calendarRouter = Router();

calendarRouter.get('/:year/:month', getCalendarEventByMonth);

calendarRouter.post('/sync-holidays', syncGoogleHolidaysController);

calendarRouter.post('/event', validate(createMeetingSchema), createCalendarEventController);

calendarRouter.delete('/event', deleteCalendarEventController);
