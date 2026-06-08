import type { Request, Response } from 'express';

import { createLeaveApplicationSchema, updateLeaveTypeSchema } from './leave.schema.js';
import { LeaveType } from '../database/leave-type.model.js';
import { Leave } from '../database/leave.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { convertToObjectId } from '../libs/utils/convert-object-id.js';
import { calculateLeaveDays, validateLeaveApplication } from '../libs/utils/leave.js';

export const createLeaveTypeController = async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Unauthorized');
  }

  const {
    name,
    description,
    code,
    allocatedDays,
    maxCarryForwardDays,
    requiresProof,
    minDaysNotice,
    isActive,
  } = req.body;

  const existingRecord = await LeaveType.findOne({
    code: code.toUpperCase(),
  });

  if (existingRecord) {
    throw new ApiError(400, 'A leave type with this code already exists.');
  }

  const leaveType = await LeaveType.create({
    name,
    description,
    code: code.toUpperCase(),
    allocatedDays,
    maxCarryForwardDays,
    requiresProof,
    minDaysNotice,
    isActive,
    createdBy: req.user.id,
  });

  return ApiResponse.success(res, {
    message: `${name} leave type created successfully`,
    data: null,
    statusCode: 201,
  });
};

export const updateLeaveTypeController = async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Unauthorized');
  }

  const { id } = req.params;

  const payload = req.body;

  const existingLeaveType = await LeaveType.findById(id);

  if (!existingLeaveType) {
    throw new ApiError(404, 'Leave Type not found');
  }

  const updatedLeaveType = await LeaveType.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return ApiResponse.success(res, {
    statusCode: 200,
    message: `${updatedLeaveType?.name} leave type updated successfully`,
    data: updatedLeaveType,
  });
};

export const getAllActiveLeaveTypesController = async (req: Request, res: Response) => {
  const leaveTypes = await LeaveType.aggregate([
    {
      $match: {
        isActive: true,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        name: 1,
        description: 1,
        code: 1,
        allocatedDays: 1,
        maxCarryForwardDays: 1,
        requiresProof: 1,
        minDaysNotice: 1,
        isActive: 1,
        createdBy: 1,
      },
    },
  ]);

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Leave types fetched successfully',
    data: leaveTypes,
  });
};

// ------------------Leave Application-------------
export const createLeaveApplicationController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const payload = req.body;

  const leaveType = await LeaveType.findOne({
    code: payload.leaveTypeCode.toUpperCase(),
    isActive: true,
  });

  if (!leaveType) {
    throw new ApiError(404, 'Leave type not found');
  }

  await validateLeaveApplication({
    userId,
    leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    proof: payload.proof,
  });

  const totalDays = calculateLeaveDays(payload.startDate, payload.endDate);

  const leave = await Leave.create({
    user: userId,
    leaveTypeCode: leaveType.code,
    startDate: payload.startDate,
    endDate: payload.endDate,
    totalDays,
    reason: payload.reason,
    proof: payload.proof ?? null,
    status: 'pending',
  });

  return ApiResponse.success(res, {
    statusCode: 201,
    message: 'Leave request submitted successfully',
    data: null,
  });
};

export const updateLeaveApplicationController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const { id } = req.params;

  const payload = req.body;

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'At least one field is required for update');
  }

  const leave = await Leave.findById(id);

  if (!leave) {
    throw new ApiError(404, 'Leave application not found');
  }

  if (leave.user.toString() !== userId) {
    throw new ApiError(403, 'You are not allowed to update this leave application');
  }

  if (leave.status !== 'pending') {
    throw new ApiError(400, `Cannot update a ${leave.status} leave application`);
  }

  const updatedStartDate = payload.startDate ?? leave.startDate;
  const updatedEndDate = payload.endDate ?? leave.endDate;
  const updatedLeaveTypeCode = payload.leaveTypeCode ?? leave.leaveTypeCode;
  const leaveType = await LeaveType.findOne({
    code: updatedLeaveTypeCode,
    isActive: true,
  });

  if (!leaveType) {
    throw new ApiError(404, 'Leave type not found');
  }

  await validateLeaveApplication({
    userId,
    leaveType,
    startDate: updatedStartDate,
    endDate: updatedEndDate,
    proof: payload.proof,
  });

  const totalDays = calculateLeaveDays(updatedStartDate, updatedEndDate);

  const updatedLeave = await Leave.findByIdAndUpdate(
    id,
    {
      $set: {
        ...payload,
        totalDays,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Leave application updated successfully',
    data: updatedLeave,
  });
};

export const reviewLeaveApplicationController = async (req: Request, res: Response) => {
  const reviewerId = req.user?.id;

  if (!reviewerId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!['admin', 'manager'].includes(req.user?.role ?? '')) {
    throw new ApiError(403, 'You are not authorized to review leave applications');
  }

  const { id } = req.params;

  const payload = req.body;

  const leave = await Leave.findById(id);

  if (!leave) {
    throw new ApiError(404, 'Leave application not found');
  }

  if (leave.status !== 'pending') {
    throw new ApiError(400, `Leave application has already been ${leave.status}`);
  }

  leave.status = payload.status;
  leave.managerComment = payload.managerComment ?? '';
  leave.approvedBy = convertToObjectId(reviewerId);

  await leave.save();

  return ApiResponse.success(res, {
    statusCode: 200,
    message: `Leave application ${payload.status} successfully`,
    data: leave,
  });
};
