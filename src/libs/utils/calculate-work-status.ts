import { timeDifference } from './time-difference.js';
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

const IST_OFFSET = 5.5;

export const setShiftTimeUTC = (date: Date, hourIST: number) => {
  const utcHour = hourIST - IST_OFFSET;

  const h = Math.floor(utcHour);
  const m = (utcHour % 1) * 60;

  const d = new Date(date);
  d.setUTCHours(h, m, 0, 0);

  return d;
};

export const checkIsLate = ({ inTime, shift }: Omit<InputType, 'outTime'>): boolean => {
  if (shift === 'free') return false;

  const inDate = new Date(inTime);

  const shiftData = workHourData.get(shift);
  if (!shiftData) throw new Error(`Invalid shift: ${shift}`);

  // ✅ convert IST rule → UTC
  const lateTime = setShiftTimeUTC(inDate, shiftData.in + shiftData.grace);

  return inDate > lateTime;
};

export const calculateWorkStatus = ({ inTime, outTime, shift }: InputType): OutputType => {
  const inDate = new Date(inTime); // ✅ UTC
  const outDate = new Date(outTime); // ✅ UTC

  // ✅ raw work hours
  const actualWorkHours = Math.max(0, Number(timeDifference(inDate, outDate).hours.toFixed(3)));

  if (shift === 'free') {
    return { workHours: actualWorkHours, status: 'present' };
  }

  const shiftData = workHourData.get(shift);
  if (!shiftData) throw new Error(`Invalid shift: ${shift}`);

  // ✅ shift boundaries (IST → UTC)
  const expectedIn = setShiftTimeUTC(inDate, shiftData.in);
  const expectedOut = setShiftTimeUTC(inDate, shiftData.out);

  // ✅ clamp inside shift window
  const effectiveIn = new Date(Math.max(inDate.getTime(), expectedIn.getTime()));
  const effectiveOut = new Date(Math.min(outDate.getTime(), expectedOut.getTime()));

  // ✅ guard edge case
  if (effectiveOut <= effectiveIn) {
    return { workHours: 0, status: 'absent' };
  }

  const workHours = Number(timeDifference(effectiveIn, effectiveOut).hours.toFixed(3));

  // ✅ apply grace
  const workHoursAfterGrace = workHours + shiftData.grace;

  const status =
    workHoursAfterGrace >= shiftData.full
      ? 'present'
      : workHoursAfterGrace >= shiftData.half
        ? 'half-day'
        : 'absent';

  return { workHours, status };
};
