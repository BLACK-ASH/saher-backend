import z, { any } from 'zod';

import { holidayTypes } from '../database/holiday.model.js';

export const eventType = ['holiday', 'session', 'task', 'meeting'];
export const daysOfTheWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export const event = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  type: z.enum(eventType),
  start: z.coerce.date(),
  end: z.coerce.date(),
  details: z.object({ date: z.coerce.date(), title: z.string(), type: z.enum(holidayTypes) }),
  allDay: z.boolean(),
  extendedProps: z.any().nullable().optional(),
});

// export const calendarObject = z.object({
//   events: z.array(event),
// });

export type CalendarObjectT = {
  date: string | null;
  day: string | null;
  events: EventT[];
};
export type EventT = z.infer<typeof event>;
