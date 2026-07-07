import z from 'zod';

export const eventType = ['holiday', 'session', 'task', 'meeting', 'calendar-event'];

export const event = z.object({
  title: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  type: z.enum(eventType),
  allDay: z.boolean(),
  details: z.object({
    id: z.string(),
    title: z.string(),
    type: z.string().nullable(),
    description: z.string().nullable(),
  }),
});

export const createCalendarEventSchema = z.object({
  title: z.string(),
  type: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  description: z.string(),
});

export const updateCalendarEventSchema = createCalendarEventSchema.partial();

export type EventT = z.infer<typeof event>;
