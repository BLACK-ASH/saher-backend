import z from 'zod';

import { event } from '../../calendar/calendar.schema.js';
import { Holiday } from '../../database/holiday.model.js';

export const calculateNumberOfDays = (year: number, monthIndex: number) => {
  const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
  return numberOfDays;
};
// const numberOfDays = calculateNumberOfDays(2026,4)

export const makeArray = (numberofDays: number) => {
  const dates = Array.from({ length: numberofDays }, (_, index) => index + 1);
  return dates;
};
// console.log(makeArray(numberOfDays));

export const getCalendarHoliday = async (year: number, month: number) => {
  const numberOfDays = calculateNumberOfDays(year, month);
  const days = makeArray(numberOfDays);

  const result = new Map();

  days.map((date) => {
    result.set(date, []);
  });

  const startOfMonth = new Date(year, month, 1);

  const endOfMonth = new Date(year, month, numberOfDays);

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
      $sort: { date: 1 },
    },
    {
      $set: { type: 'holiday' },
    },
    {
      $set: {
        startDate: {
          $dateFromParts: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            hour: 0, // Set your specific hour here (0-23)
            minute: 0, // Optional: sets minutes to 0
            second: 0, // Optional: sets seconds to 0
          },
        },
      },
    },
    {
      $set: {
        endDate: {
          $dateFromParts: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            hour: 23, // Set your specific hour here (0-23)
            minute: 59, // Optional: sets minutes to 0
            second: 59, // Optional: sets seconds to 0
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        title: 1,
        type: 1,
        date: 1,
        startDate: 1,
        endDate: 1,
      },
    },
  ]);

  // console.log(data);

  const dataParsed = z.array(event).parse(data);
  // console.log('parsed value ', dataParsed);

  data.map((event) => {
    const date = event.date.getDate();
    const previous = result.get(date);
    result.set(date, [...previous, event]);
  });
  // console.log(result);
  const finalResult = Object.fromEntries(result);
  return finalResult;
};
