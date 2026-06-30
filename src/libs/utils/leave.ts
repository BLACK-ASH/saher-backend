import type { LeaveTypeType } from '../../database/leave-type.model.js';
import { Leave } from '../../database/leave.model.js';
import { ApiError } from '../class/api-error.js';

export const validateLeaveApplication = async ({
  userId,
  leaveType,
  startDate,
  endDate,
  proof,
}: {
  userId: string;
  leaveType: LeaveTypeType;
  startDate: Date;
  endDate: Date;
  proof?: string;
}) => {
  // Notice period validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leaveStartDate = new Date(startDate);
  leaveStartDate.setHours(0, 0, 0, 0);

  const noticeDays = Math.floor(
    (leaveStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (noticeDays < leaveType.minDaysNotice) {
    throw new ApiError(
      400,
      `${leaveType.name} requires at least ${leaveType.minDaysNotice} days notice`,
    );
  }

  // Proof validation
  if (leaveType.requiresProof && !proof) {
    throw new ApiError(400, `Proof is required for ${leaveType.name}`);
  }

  // Overlapping leave validation
  const overlappingLeave = await Leave.findOne({
    user: userId,
    status: {
      $in: ['pending', 'approved'],
    },
    startDate: {
      $lte: endDate,
    },
    endDate: {
      $gte: startDate,
    },
  });

  if (overlappingLeave) {
    throw new ApiError(400, 'You already have a leave request for the selected dates');
  }
};

export const calculateLeaveDays = (startDate: Date, endDate: Date) => {
  const totalDays =
    Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (totalDays <= 0) {
    throw new ApiError(400, 'End date must be after or equal to start date');
  }

  return totalDays;
};
