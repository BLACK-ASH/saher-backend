import { google } from 'googleapis';

import { normalizeDoc } from './normailize-doc.js';
import { Holiday } from '../../database/holiday.model.js';

export const calculateNumberOfDays = (year: number, monthIndex: number) => {
  const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
  return numberOfDays;
};

export const getCalendarHoliday = async (year: number, month: number) => {
  const numberOfDays = calculateNumberOfDays(year, month);

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
        details: {
          date: '$date',
          type: {
            $cond: [{ $eq: ['$type', 'google'] }, 'public-holiday', '$type'],
          },
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
        start: {
          $dateFromParts: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            hour: 0,
            minute: 0,
            second: 0,
          },
        },
        end: {
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
      $set: {
        allDay: true,
      },
    },
    {
      $set: {
        extendedProps: null,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        type: 1,
        date: 1,
        allDay: 1,
        start: 1,
        end: 1,
        details: 1,
        extendedProps: 1,
      },
    },
  ]);

  const normalized = normalizeDoc(data);

  return normalized;
};

const calendarClient = google.calendar({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY,
});

export const fetchGoogleHolidays = async (year: number) => {
  const response = await calendarClient.events.list({
    calendarId: 'en.indian#holiday@group.v.calendar.google.com',
    timeMin: `${year}-01-01T00:00:00Z`,
    timeMax: `${year}-12-31T23:59:59Z`,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 200,
  });

  return response.data.items ?? [];
};
// ---------------------Logic to calculate isFullDay in Events
// {
//     $set: {
//       isFullDay: {
//         $cond: {
//           if: {
//             $gt: [{$divide: [{ $subtract: ["$endDate", "$startDate"] },3600000]},8]
//           },
//           then: true,
//           else: false
//         }
//       }
//     }
//   }
