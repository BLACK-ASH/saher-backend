import { Router } from 'express';

import { getCalendarEventByMonth } from './calender.controller.js';

export const calendarRouter = Router();

calendarRouter.get('/:year/:month', getCalendarEventByMonth);
