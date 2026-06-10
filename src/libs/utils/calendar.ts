import { google } from 'googleapis';

import { normalizeDoc } from './normailize-doc.js';
import type { EventT } from '../../calendar/calendar.schema.js';
import { Holiday } from '../../database/holiday.model.js';
import { Session } from '../../database/session.model.js';

export const calculateNumberOfDays = (year: number, monthIndex: number) => {
  const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
  return numberOfDays;
};

export const getCalendarHoliday = async (year: number, month: number): Promise<EventT[]> => {
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
          id: '$_id',
          title: '$title',
          type: {
            $cond: [{ $eq: ['$type', 'google'] }, 'public-holiday', '$type'],
          },
          description: '$description',
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
      $set: {
        allDay: true,
      },
    },

    {
      $sort: {
        start: 1,
      },
    },
    {
      $project: {
        // title: 1,
        type: 1,
        date: 1,
        allDay: 1,
        start: 1,
        end: 1,
        details: 1,
      },
    },
  ]);

  return normalizeDoc(data) as EventT[];
};

export const getCalendarEvents = async (year: number, month: number): Promise<EventT[]> => {
  const numberOfDays = calculateNumberOfDays(year, month);

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month, numberOfDays + 1);

  const data = await Session.aggregate([
    {
      $match: {
        startTime: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
      },
    },
    {
      $set: {
        details: {
          id: '$_id',
          title: '$title',
          type: null,
          description: '$description',
        },
      },
    },
    {
      $set: {
        type: 'session',
      },
    },
    {
      $set: {
        start: '$startTime',
        end: '$endTime',
      },
    },
    {
      $set: {
        allDay: false,
      },
    },
    {
      $project: {
        type: 1,
        date: 1,
        start: 1,
        end: 1,
        allDay: 1,
        details: 1,
      },
    },
    {
      $sort: {
        start: 1,
      },
    },
  ]);

  return normalizeDoc(data) as EventT[];
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
