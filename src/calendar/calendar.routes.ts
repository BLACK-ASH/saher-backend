import { Router } from 'express';

import { createCalendarEventSchema, updateCalendarEventSchema } from './calendar.schema.js';
import {
  createCalendarEventController,
  deleteCalendarEventController,
  getCalendarEventByMonth,
  syncGoogleHolidaysController,
  updateCalendarEventController,
} from './calender.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

export const calendarRouter = Router();

calendarRouter.get('/:year/:month', getCalendarEventByMonth);

calendarRouter.post('/sync-holidays', syncGoogleHolidaysController);

calendarRouter.post('/event', validate(createCalendarEventSchema), createCalendarEventController);

calendarRouter.put(
  '/event/:id',
  validate(updateCalendarEventSchema),
  updateCalendarEventController,
);
calendarRouter.delete('/event/:id', deleteCalendarEventController);
