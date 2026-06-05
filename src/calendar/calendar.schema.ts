import z from 'zod';

import { holidayTypes } from '../database/holiday.model.js';

export const eventType = ['holiday', 'session', 'task', 'meeting'];

export const event = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
  type: z.enum(eventType),
  allDay: z.boolean(),
  details: z.object({
    id: z.string(),
    title: z.string().optional(),
    type: z.enum(holidayTypes).optional().nullable(),
    description: z.string().optional().nullable(),
  }),
});

export type CalendarObjectT = {
  date: string | null;
  day: string | null;
  events: EventT[];
};
export type EventT = z.infer<typeof event>;
