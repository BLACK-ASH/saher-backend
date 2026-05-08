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

const IST_TIMEZONE = 'Asia/Kolkata';

export const toISTDate = (date: Date | string | number): Date => {
  return new Date(new Date(date).toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
};

const setISTTime = (date: Date, hours: number): Date => {
  const d = new Date(date); // already IST
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);

  d.setHours(h, m, 0, 0); // SAFE (because date is already IST)
  return d;
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

export const checkIsLate = ({ inTime, shift }: Omit<InputType, 'outTime'>): boolean => {
  if (shift === 'free') return false;

  const inDate = toISTDate(inTime);

  const shiftData = workHourData.get(shift);
  if (!shiftData) throw new Error(`Invalid shift: ${shift}`);

  const lateTime = setISTTime(inDate, shiftData.in + shiftData.grace);

  return inDate > lateTime;
};

export const calculateWorkStatus = ({ inTime, outTime, shift }: InputType): OutputType => {
  const inDate = toISTDate(inTime);
  const outDate = toISTDate(outTime);

  const actualWorkHour = Math.max(0, Number(timeDifference(outDate, inDate).hours.toFixed(3)));

  if (shift === 'free') {
    return { workHours: actualWorkHour, status: 'present' };
  }

  const shiftData = workHourData.get(shift);
  if (!shiftData) throw new Error(`Invalid shift: ${shift}`);

  // ✅ Shift boundaries in IST
  const expectedIn = setISTTime(inDate, shiftData.in);
  const expectedOut = setISTTime(inDate, shiftData.out);

  // ✅ Clamp within shift window
  const effectiveIn = new Date(Math.max(inDate.getTime(), expectedIn.getTime()));
  const effectiveOut = new Date(Math.min(outDate.getTime(), expectedOut.getTime()));

  const workHours = Math.max(0, Number(timeDifference(effectiveIn, effectiveOut).hours.toFixed(3)));

  const workHoursAfterGrace = workHours + shiftData.grace;

  const status =
    workHoursAfterGrace >= shiftData.full
      ? 'present'
      : workHoursAfterGrace >= shiftData.half
        ? 'half-day'
        : 'absent';

  return { workHours, status };
};
