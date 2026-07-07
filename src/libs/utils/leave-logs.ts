// import { LeaveBalance } from '../../database/leave-balance.model.js';
import { z } from 'zod';

import { LeaveBalance } from '../../database/leave-balance.model.js';
import { leaveActionTypes, LeaveLog } from '../../database/leave-log.model.js';

export const CreateLeaveLogSchema = z.object({
  user: z.string(),
  leaveTypeCode: z.string(),
  year: z.string(),
  actionType: z.enum(leaveActionTypes),
  count: z.number(),
  previousBalance: z.number(),
  newBalance: z.number(),
  performedBy: z.string().optional(),
  referenceId: z.string().optional(),
  remarks: z.string().optional(),
});

export type CreateLeaveLogInput = z.infer<typeof CreateLeaveLogSchema>;

export const createLeaveLog = async ({
  user,
  leaveTypeCode,
  year,
  actionType,
  count,
  previousBalance,
  newBalance,
  performedBy,
  referenceId,
  remarks,
}: CreateLeaveLogInput) => {
  return LeaveLog.create({
    user,
    leaveTypeCode,
    year,
    actionType,
    count,
    previousBalance,
    newBalance,
    performedBy,
    referenceId,
    remarks,
  });
};

interface RecordLeaveUsageInput {
  userId: string;
  leaveTypeCode: string;
  year: string;
  days: number;
  performedBy: string;
  leaveId: string;
}

export const recordLeaveUsage = async ({
  userId,
  leaveTypeCode,
  year,
  days,
  performedBy,
  leaveId,
}: RecordLeaveUsageInput) => {
  const balance = await LeaveBalance.findOneAndUpdate(
    {
      user: userId,
      year,
    },
    {
      $inc: {
        [`used.${leaveTypeCode}`]: days,
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

  const newUsed = balance?.used?.get(leaveTypeCode) ?? 0;

  const previousUsed = newUsed - days;

  await createLeaveLog({
    user: userId,
    leaveTypeCode,
    year,
    actionType: 'LEAVE_APPROVED',
    count: days,
    previousBalance: previousUsed,
    newBalance: newUsed,
    performedBy,
    referenceId: leaveId,
    remarks: 'Leave approved',
  });

  return balance;
};
