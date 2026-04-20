import { timeDifference } from './time-difference.js';

const employeeDetails = {
  fullTime: { fullWorkHours: 9, halfWorkHours: 4.5, graceHours: 1, expectedTime: 9 },
  // partTimeShift1: { fullWorkHours: 4, halfWorkHours: 2, graceHours: 0.5 , expectedTime : 9  },
  partTime: { fullWorkHours: 4, halfWorkHours: 2, graceHours: 0.5, expectedTime: 2 },
  volunteer: { fullWorkHours: 0, halfWorkHours: 0, graceHours: 0, expectedTime: 0 },
};

export const calculateWorkHours = (
  employeeType: 'full-time' | 'part-time' | 'volunteer',
  inTime: Date,
) => {
  const now = new Date();

  const final = employeeType === 'full-time' ? employeeDetails.fullTime : employeeDetails.partTime;

  const actualWorkHours = Number(timeDifference(inTime as Date, now).hours.toFixed(3));
  const expectedTime = new Date(now);
  expectedTime.setHours(final.expectedTime, 0, 0, 0);
  const workHoursFromExpectedTime = Math.max(
    0,
    Number(timeDifference(expectedTime, now).hours.toFixed(3)),
  );
  const workHours =
    actualWorkHours > workHoursFromExpectedTime ? workHoursFromExpectedTime : actualWorkHours;

  return workHours;
};
