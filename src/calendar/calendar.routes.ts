import { Router } from 'express';

import { createCalendarEventSchema, updateCalendarEventSchema } from './calendar.schema.js';
import {
  createCalendarEventController,
  deleteCalendarEventController,
  getCalendarEventByMonth,
  restoreCalendarEventController,
  syncGoogleHolidaysController,
  updateCalendarEventController,
} from './calender.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

export const calendarRouter = Router();

// Read access for all authenticated users (org-wide calendar).
calendarRouter.get('/:year/:month', getCalendarEventByMonth);

// Syncing Google holidays writes org-wide holiday data — requires event write.
calendarRouter.post('/sync-holidays', authorize('write', 'event'), syncGoogleHolidaysController);

calendarRouter.post(
  '/event',
  authorize('write', 'event'),
  validate(createCalendarEventSchema),
  createCalendarEventController,
);

calendarRouter.put(
  '/event/:id',
  authorize('update', 'event'),
  validate(updateCalendarEventSchema),
  updateCalendarEventController,
);
calendarRouter.delete('/event/:id', authorize('delete', 'event'), deleteCalendarEventController);
calendarRouter.patch(
  '/event/restore/:id',
  authorize('update', 'event'),
  restoreCalendarEventController,
);
