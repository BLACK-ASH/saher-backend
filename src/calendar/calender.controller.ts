import type { Request, Response } from 'express';
import z from 'zod';

import { event } from './calendar.schema.js';
import { CalendarEvent } from '../database/calendar-event.model.js';
import { Holiday } from '../database/holiday.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import {
  createKey,
  deleteCache,
  deleteCacheGroup,
  getCache,
  setCacheWithGroup,
} from '../libs/redis/redis-utils.js';
import {
  fetchGoogleHolidays,
  getCalendarEvents,
  getCalendarHoliday,
  getCalendarSession,
} from '../libs/utils/calendar.js';

export const getCalendarEventByMonth = async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);

  const key = createKey('calendar', year, month);
  const cachedData = await getCache(key);
  if (cachedData) {
    const parsed = z.array(event).parse(cachedData);

    return ApiResponse.success(res, {
      message: 'the data from Cache  ',
      data: parsed,
      statusCode: 200,
    });
  }

  const holidays = await getCalendarHoliday(year, month);
  const sessions = await getCalendarSession(year, month);
  const events = await getCalendarEvents(year, month);
  const result = [...holidays, ...sessions, ...events];
  await setCacheWithGroup(key, result, ['calendar'], 7776000);

  const parsed = z.array(event).parse(result);
  await setCacheWithGroup(key, result, ['calendar'], 7776000);

  return ApiResponse.success(res, {
    message: 'the data from DB ',
    data: parsed,
    statusCode: 200,
  });
};

export const deleteCalendarEventController = async (req: Request, res: Response) => {
  const { id } = req.params;
  await CalendarEvent.findByIdAndDelete(id);

  return ApiResponse.success(res, {
    message: 'Calendar Event Deleted SuccessFully',
    data: null,
    statusCode: 204,
  });
};

export const createCalendarEventController = async (req: Request, res: Response) => {
  const { title, type, description, start, end } = req.body;

  const existingRecord = await CalendarEvent.findOne({ type: type, start: start, end: end });
  if (existingRecord) throw new ApiError(400, 'there is already an event added');

  await CalendarEvent.create({
    title,
    description,
    start,
    end,
    type,
  });

  const month = new Date(start).getMonth();
  const year = new Date(start).getFullYear();
  const key = createKey('calendar', year, month);

  await deleteCache(key);

  return ApiResponse.success(res, {
    message: 'The Event has been added successfully',
    data: null,
    statusCode: 201,
  });
};

export const syncGoogleHolidaysController = async (req: Request, res: Response) => {
  const year = new Date().getFullYear();

  if (!year) {
    throw new Error('Year is required');
  }

  const googleHolidays = await fetchGoogleHolidays(year);

  const operations = googleHolidays
    .filter(
      (holiday): holiday is typeof holiday & { summary: string } =>
        typeof holiday.summary === 'string',
    )
    .map((holiday) => ({
      updateOne: {
        filter: {
          title: holiday.summary,
          date: new Date(holiday.start?.date as string),
        },
        update: {
          $setOnInsert: {
            title: holiday.summary,
            date: new Date(holiday.start?.date as string),
            type: 'google',
            description: null,
          },
        },
        upsert: true,
      },
    }));

  if (operations.length > 0) {
    await Holiday.bulkWrite(operations);
  }

  await deleteCacheGroup('calendar');
  return ApiResponse.success(res, {
    statusCode: 200,
    message: `${operations.length} holidays synced successfully`,
    data: {
      synced: operations.length,
      year,
    },
  });
};
