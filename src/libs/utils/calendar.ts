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
      $set: {
        details: {
          date: '$date',
          title: '$title',
          description: '$description',
        },
      },
    },
    {
      $set: {
        extendedProps: {
          speaker: {
            $map: {
              input: '$speaker',
              as: 'sp',
              in: {
                $toString: '$$sp',
              },
            },
          },
          participants: '$participants',
          sessionId: {
            $toString: '$_id',
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        type: 1,
        date: 1,
        start: 1,
        end: 1,
        allDay: 1,
        details: 1,
        extendedProps: 1,
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
