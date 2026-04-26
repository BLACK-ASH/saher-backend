import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { Account } from '../../database/account.model.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { AttendanceResponseSchema } from '../retrieve/me.controller.js';

const AttendanceCheckInSchema = AttendanceResponseSchema.omit({
  user: true,
  workHours: true,
}).readonly();
export const checkInController = async (req: Request, res: Response) => {
  //Step 1 - Check if the user has token or not
  const user = req.user;
  const now = new Date();

  //Step 2 - Check karo ki user ne pehle se aaj ki attendence toh nahi mark kari hai
  const existingRecord = await Attendance.findOne({
    user: user?.id,
    date: standardDateString(now),
    inTime: { $ne: null },
  });
  //Step 3 - Agr haa toh oosko dubara attendence mark karne mat do
  // Using Custom Api Error Handler To Automatically handle error response
  if (existingRecord) throw new ApiError(400, 'You Have Already Check In Today.');

  // Change Bad Mai Karna Hai

  // ----------------------------------------Need to uncomment after employeeType in req.user is updated ------\
  const account = await Account.findOne({ user: user?.id });
  if (!account) throw new ApiError(400, 'Account not found ');
  const employeeDetails = {
    fullTime: { expectedTimeHours: 10, expectedTimeMins: 0 },
    partTimeShift1: { expectedTimeHours: 9, expectedTimeMins: 30 },
    partTimeShift2: { expectedTimeHours: 2, expectedTimeMins: 30 },
  };
  let finalEmployeeDetails;

  if (account?.employeeType === 'full-time') {
    finalEmployeeDetails = employeeDetails.fullTime;
  } else if (account?.employeeShift === 'shift-1') {
    finalEmployeeDetails = employeeDetails.partTimeShift1;
  } else if (account?.employeeShift === 'shift-2') {
    finalEmployeeDetails = employeeDetails.partTimeShift2;
  } else {
    throw new ApiError(400, 'Invalid employee configuration');
  }

  // const hours  = User?.employeeType==="full-time" ? employeeDetails.fullTime.expectedTimeHours  : User?.employeeType === "part-time-morning" ? employeeDetails.partTimeShift1.expectedTimeHours : employeeDetails.partTimeShift2.expectedTimeHours

  // const mins = req.user?.employeeType === "full-time" ? employeeDetails.fullTime.expectedTimeMins : user.employeeType === "part-time-morning" ? employeeDetails.partTimeShift1.expectedTimeMins : employeeDetails.partTimeShift2.expectedTimeMins

  const expectedTime = new Date(now);
  expectedTime.setHours(
    finalEmployeeDetails.expectedTimeHours,
    finalEmployeeDetails.expectedTimeMins,
    0,
    0,
  );

  // ------------------------------------------------------
  // const expectedTime = new Date();
  // //Abhi ke liye aise hii hardcore data liya hai
  // expectedTime.setHours(10, 0, 0, 0);

  // Updating Cron Record
  const cronRecord = await Attendance.findOne({
    user: user?.id,
    date: standardDateString(now),
  });

  if (cronRecord) {
    cronRecord.inTime = now;
    cronRecord.status = 'present';
    cronRecord.isLate = now > expectedTime;
    await cronRecord.save();

    const normalized = normalizeDoc(cronRecord.toObject());
    const parsed = AttendanceCheckInSchema.parse(normalized);
    return ApiResponse.success(res, {
      message: 'You have been marked present',
      data: parsed,
      statusCode: 200,
    });
  }

  // Special case is user is check in before cron job
  //Step 5 - if User exist and have not submitted today's attendence start making new entry
  //Step6 - Note the current time so that late hai ki nahi ka pata chal     sake
  const newRecord = await Attendance.create({
    user: user?.id,
    inTime: now,
    status: 'present',
    date: standardDateString(now),
    isLate: now > expectedTime,
  });

  const normalized = normalizeDoc(newRecord.toObject());
  // console.log(normalized)
  const parsed = AttendanceCheckInSchema.parse(normalized);
  return ApiResponse.success(res, {
    message: 'You have been marked present',
    data: parsed,
    statusCode: 200,
  });
};
