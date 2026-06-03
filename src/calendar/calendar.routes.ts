import { Router } from 'express';

import { getCalendarEventByMonth, syncGoogleHolidaysController } from './calender.controller.js';

export const calendarRouter = Router();

calendarRouter.get('/:year/:month', getCalendarEventByMonth);

calendarRouter.post('/sync-holidays', syncGoogleHolidaysController);
