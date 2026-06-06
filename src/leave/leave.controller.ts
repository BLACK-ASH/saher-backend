import type { Request, Response } from 'express';

import type { LeaveSchemaType } from './leave.schema.js';
import { LeaveType } from '../database/leave-type.model.js';
import { Leave } from '../database/leave.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';

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

export const applyLeaveController = async (req: Request, res: Response) => {
  const parsedInput = req.body as LeaveSchemaType;

  const user = req.user;

  if (new Date(parsedInput.date) < new Date())
    throw new ApiError(400, 'Cannot Appy For Past Date.');

  const leave = await Leave.create({ user: user?.id, ...parsedInput });

  // return res.status(200).json({
  //   success: true,
  //   message: 'Leave applied successfully',
  //   data: leave,
  // });

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Leave applied successfully',
    data: null,
  });
};
