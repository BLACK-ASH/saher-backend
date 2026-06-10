import { Temporal } from '@js-temporal/polyfill';

export type DateRangeResult = {
  startDate: Date;
  endDate: Date;

  startDateString: string;
  endDateString: string;

  includesToday: boolean;
  totalDays: number;
};

type BaseOptions = {
  includeToday?: boolean;
};

type LastDaysOptions = BaseOptions & {
  days: number;
};

type CustomOptions = {
  start: string | Date;
  end: string | Date;
};

export class DateRange {
  private static timezone = Temporal.Now.timeZoneId();

  private static toDate(plainDateTime: Temporal.PlainDateTime): Date {
    return new Date(plainDateTime.toZonedDateTime(this.timezone).epochMilliseconds);
  }

  private static startOfDay(date: Temporal.PlainDate) {
    return date.toPlainDateTime({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
  }

  private static endOfDay(date: Temporal.PlainDate) {
    return date.toPlainDateTime({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
  }

  private static buildResult(start: Temporal.PlainDate, end: Temporal.PlainDate): DateRangeResult {
    const today = Temporal.Now.plainDateISO(this.timezone);

    return {
      startDate: this.toDate(this.startOfDay(start)),

      endDate: this.toDate(this.endOfDay(end)),

      startDateString: start.toString(),

      endDateString: end.toString(),

      includesToday:
        Temporal.PlainDate.compare(today, start) >= 0 &&
        Temporal.PlainDate.compare(today, end) <= 0,

      totalDays:
        start.until(end, {
          largestUnit: 'days',
        }).days + 1,
    };
  }

  static today(): DateRangeResult {
    const today = Temporal.Now.plainDateISO(this.timezone);

    return this.buildResult(today, today);
  }

  static week({ includeToday = false }: BaseOptions = {}): DateRangeResult {
    const today = Temporal.Now.plainDateISO(this.timezone);

    const current = includeToday ? today : today.subtract({ days: 1 });

    const start = current.subtract({
      days: current.dayOfWeek - 1,
    });

    const end = start.add({ days: 6 });

    return this.buildResult(start, end);
  }

  static month({ includeToday = false }: BaseOptions = {}): DateRangeResult {
    const today = Temporal.Now.plainDateISO(this.timezone);

    const current = includeToday ? today : today.subtract({ days: 1 });

    const start = current.with({ day: 1 });

    const end = current;

    return this.buildResult(start, end);
  }

  static year({ includeToday = false }: BaseOptions = {}): DateRangeResult {
    const today = Temporal.Now.plainDateISO(this.timezone);

    const current = includeToday ? today : today.subtract({ days: 1 });

    const start = current.with({
      month: 1,
      day: 1,
    });

    return this.buildResult(start, current);
  }

  static lastDays({ days, includeToday = false }: LastDaysOptions): DateRangeResult {
    const today = Temporal.Now.plainDateISO(this.timezone);

    const end = includeToday ? today : today.subtract({ days: 1 });

    const start = end.subtract({
      days: days - 1,
    });

    return this.buildResult(start, end);
  }

  static custom({ start, end }: CustomOptions): DateRangeResult {
    const startDate =
      typeof start === 'string'
        ? Temporal.PlainDate.from(start)
        : Temporal.Instant.fromEpochMilliseconds(start.getTime())
            .toZonedDateTimeISO(this.timezone)
            .toPlainDate();

    const endDate =
      typeof end === 'string'
        ? Temporal.PlainDate.from(end)
        : Temporal.Instant.fromEpochMilliseconds(end.getTime())
            .toZonedDateTimeISO(this.timezone)
            .toPlainDate();

    return this.buildResult(startDate, endDate);
  }
}
