import z from 'zod';

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
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(eventType),
  startDate: z.date(),
  endDate: z.date(),
});

export const calendarObject = z.object({
  date: z.date(),
  day: z.enum(daysOfTheWeek),
  events: z.array(event),
});
export type EventT = z.infer<typeof event>;
