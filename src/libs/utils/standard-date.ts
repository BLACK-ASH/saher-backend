// export const standardDateString = (date: Date | string | number) => {
//   return new Intl.DateTimeFormat('en-CA', {
//     timeZone: 'Asia/Kolkata',
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//   }).format(new Date(date));
// };
import { Temporal } from '@js-temporal/polyfill';

export const standardDateString = (date: Date | string | number): string => {
  const instant = Temporal.Instant.from(new Date(date).toISOString());

  return instant.toZonedDateTimeISO('Asia/Kolkata').toPlainDate().toString();
};
