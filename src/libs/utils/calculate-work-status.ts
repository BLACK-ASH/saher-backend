import { Temporal } from '@js-temporal/polyfill';

import type { AccountT } from '../../admin/_services/account.js';

type InputType = {
  inTime: Date | string;
  outTime: Date | string;
  shift: 'free' | 'full-time' | 'shift-1' | 'shift-2';
};

type ShiftData = {
  in: number;
  out: number;
  half: number;
  full: number;
  grace: number;
};

type OutputType = {
  workHours: number;
  status: 'present' | 'half-day' | 'absent';
};

const IST_TIMEZONE = 'Asia/Kolkata';

// -------------------------
// export const toISTDate = (date: Date | string | number): Date => {
// return new Date(new Date(date).toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
// };

// const setISTTime = (date: Date, hours: number): Date => {
//   const d = new Date(date); // already IST
//   const h = Math.floor(hours);
//   const m = Math.round((hours % 1) * 60);

//   d.setHours(h, m, 0, 0); // SAFE (because date is already IST)
//   return d;
// };
// ------------------------------------

export const workHourData = new Map<string, ShiftData>([
  ['full-time', { in: 9, out: 18, half: 4, full: 8, grace: 1 }],
  ['shift-1', { in: 9, out: 13, half: 2, full: 4, grace: 0.5 }],
  ['shift-2', { in: 14, out: 18, half: 2, full: 4, grace: 0.5 }],
]);

export const getShift = (account: AccountT): 'full-time' | 'shift-1' | 'shift-2' | 'free' => {
  if (account.employeeType === 'full-time') return 'full-time';
  if (account.employeeType === 'part-time') {
    if (account.employeeShift) {
      return account.employeeShift;
    }
  }
  return 'free';
};

const toISTZonedDateTime = (date: Date | string) => {
  const instant = Temporal.Instant.from(new Date(date).toISOString());

  return instant.toZonedDateTimeISO(IST_TIMEZONE);
};

export const setShiftHour = (date: Temporal.ZonedDateTime, hour: number) => {
  const h = Math.floor(hour);

  const m = Math.round((hour % 1) * 60);

  return date.with({
    hour: h,
    minute: m,
    second: 0,
    millisecond: 0,
  });
};

export const checkIsLate = ({ inTime, shift }: Omit<InputType, 'outTime'>): boolean => {
  if (shift === 'free') return false;

  const inDate = toISTZonedDateTime(inTime);

  const shiftData = workHourData.get(shift);
  if (!shiftData) throw new Error(`Invalid shift: ${shift}`);

  const lateTime = setShiftHour(inDate, shiftData.in + shiftData.grace);

  return Temporal.ZonedDateTime.compare(inDate, lateTime) > 0;
};

export const calculateWorkStatus = ({ inTime, outTime, shift }: InputType): OutputType => {
  const inDate = toISTZonedDateTime(inTime);

  const outDate = toISTZonedDateTime(outTime);

  const actualWorkHour = outDate
    .since(inDate, {
      largestUnit: 'hours',
    })
    .total('hours');

  if (shift === 'free') {
    return {
      workHours: Math.max(0, Number(actualWorkHour.toFixed(3))),
      status: 'present',
    };
  }

  const shiftData = workHourData.get(shift);
  if (!shiftData) throw new Error(`Invalid shift: ${shift}`);

  // ✅ Shift boundaries in IST
  const expectedIn = setShiftHour(inDate, shiftData.in);

  const expectedOut = setShiftHour(inDate, shiftData.out);

  // ✅ Clamp within shift window
  const effectiveIn = Temporal.ZonedDateTime.compare(inDate, expectedIn) > 0 ? inDate : expectedIn;

  const effectiveOut =
    Temporal.ZonedDateTime.compare(outDate, expectedOut) < 0 ? outDate : expectedOut;

  const workHours = effectiveOut
    .since(effectiveIn, {
      largestUnit: 'hours',
    })
    .total('hours');

  // ✅ apply grace
  const workHoursAfterGrace = workHours + shiftData.grace;

  const status =
    workHoursAfterGrace >= shiftData.full
      ? 'present'
      : workHoursAfterGrace >= shiftData.half
        ? 'half-day'
        : 'absent';

  return {
    workHours: Math.max(0, Number(workHours.toFixed(3))),
    status,
  };
};
