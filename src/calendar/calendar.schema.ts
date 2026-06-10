import z from 'zod';

import { holidayTypes } from '../database/holiday.model.js';

export const eventType = ['holiday', 'session', 'task', 'meeting'];

export const event = z.object({
  title: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  type: z.enum(eventType),
  allDay: z.boolean(),
  details: z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(holidayTypes).nullable(),
    description: z.string().nullable(),
  }),
});

export type CalendarObjectT = {
  date: string | null;
  day: string | null;
  events: EventT[];
};

export type EventT = z.infer<typeof event>;
