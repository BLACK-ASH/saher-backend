import z from 'zod';

import { normalizeDoc } from './normailize-doc.js';
import { standardDateString } from './standard-date.js';
import type { CalendarObjectT} from '../../calendar/calendar.schema.js';
import { event } from '../../calendar/calendar.schema.js';
import { Holiday } from '../../database/holiday.model.js';

export const calculateNumberOfDays = (year: number, monthIndex: number) => {
  const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
  return numberOfDays;
};
// const numberOfDays = calculateNumberOfDays(2026,4)

// export const makeArray = (numberofDays: number) => {
//   const dates = Array.from({ length: numberofDays }, (_, index) => index + 1);
//   return dates;
// }

export const getCalendarHoliday = async (year: number, month: number) => {
  const numberOfDays = calculateNumberOfDays(year, month);

  const calendar: CalendarObjectT[] = Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(year, month, index + 1);
    // const stringDate = standardDateString(date)

    return {
      date: standardDateString(date),
      day: date.toLocaleDateString('en-US', {
        weekday: 'long',
      }),
      events: [],
    };
  });

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month, numberOfDays + 1);

  const data = await Holiday.aggregate([
    {
      $match: {
        date: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
      },
    },
    {
      $set: {
        meta: {
          date: '$date',
          type: '$type',
          title: '$title',
        },
      },
    },
    {
      $set: {
        type: 'holiday',
      },
    },
    {
      $set: {
        startDate: {
          $dateFromParts: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            hour: 0,
            minute: 0,
            second: 0,
          },
        },
        endDate: {
          $dateFromParts: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            hour: 23,
            minute: 59,
            second: 59,
          },
        },
      },
    },
    {
      $sort: {
        date: 1,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        type: 1,
        date: 1,
        startDate: 1,
        endDate: 1,
        meta: 1,
      },
    },
  ]);
  const normalized = normalizeDoc(data);
  // console.log(normalized);

  const dataParsed = z.array(event).parse(normalized);

  dataParsed.forEach((event) => {
    const dayIndex = event.startDate.getDate() - 1;

    calendar[dayIndex].events.push(event);
  });

  return calendar;
};
