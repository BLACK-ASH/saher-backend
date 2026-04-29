import { AccountT } from '../../admin/_services/account.js';
import { timeDifference } from './time-difference.js';

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

const IST_OFFSET_MINUTES = 330; // 5h 30m

function setISTTime(date: Date, hours: number): Date {
  const totalMinutes = hours * 60 - IST_OFFSET_MINUTES;

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return new Date(date.setUTCHours(h, m, 0, 0));
}

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
  const inDate = new Date(inTime);

  const shiftData = workHourData.get(shift);
  if (!shiftData) {
    throw new Error(`Invalid shift: ${shift}`);
  }
  const lateTime = new Date(inDate);
  lateTime.setHours(shiftData.in + shiftData.grace, 0, 0, 0);

  return inDate > lateTime;
};

export const calculateWorkStatus = ({ inTime, outTime, shift }: InputType): OutputType => {
  const inDate = new Date(inTime);
  const outDate = new Date(outTime);

  const actualWorkHour = Number(timeDifference(inDate, outDate).hours.toFixed(3));

  if (shift === 'free') {
    return { workHours: actualWorkHour, status: 'present' };
  }

  const shiftData = workHourData.get(shift);
  if (!shiftData) {
    throw new Error(`Invalid shift: ${shift}`);
  }

  // Expected shift boundaries

  const expectedIn = setISTTime(new Date(inDate), shiftData.in);
  const expectedOut = setISTTime(new Date(inDate), shiftData.out);

  // Clamp work within shift window
  const effectiveIn = new Date(Math.max(inDate.getTime(), expectedIn.getTime()));

  const effectiveOut = new Date(Math.min(outDate.getTime(), expectedOut.getTime()));

  const workHours = Math.max(0, Number(timeDifference(effectiveIn, effectiveOut).hours.toFixed(3)));

  // Apply grace
  const workHoursAfterGrace = workHours + shiftData.grace;

  const status =
    workHoursAfterGrace >= shiftData.full
      ? 'present'
      : workHoursAfterGrace >= shiftData.half
        ? 'half-day'
        : 'absent';

  return { workHours, status };
};
