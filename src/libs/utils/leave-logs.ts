// import { LeaveBalance } from '../../database/leave-balance.model.js';
import { z } from 'zod';

import { LeaveBalance } from '../../database/leave-balance.model.js';
import { leaveActionTypes, LeaveLog } from '../../database/leave-log.model.js';

export const CreateLeaveLogSchema = z.object({
  user: z.string(),
  leaveCode: z.string(),
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
  leaveCode,
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
    leaveCode,
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
  leaveCode: string;
  year: string;
  days: number;
  performedBy: string;
  leaveId: string;
}

export const recordLeaveUsage = async ({
  userId,
  leaveCode,
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
        [`used.${leaveCode}`]: days,
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

  const newUsed = balance?.used?.get(leaveCode) ?? 0;

  const previousUsed = newUsed - days;

  await createLeaveLog({
    user: userId,
    leaveCode,
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
