import z from 'zod';

import { holidayTypes } from '../database/holiday.model.js';

export const eventType = ['holiday', 'session', 'task', 'meeting'];
export const daysOfTheWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
export const event = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(eventType),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  meta: z.object({ date: z.coerce.date(), title: z.string(), type: z.enum(holidayTypes) }),
});

export const calendarObject = z.object({
  date: z.date(),
  day: z.enum(daysOfTheWeek),
  events: z.array(event),
});

export type CalendarObjectT = {
  date: string;
  day: string;
  events: EventT[];
};
export type EventT = z.infer<typeof event>;
