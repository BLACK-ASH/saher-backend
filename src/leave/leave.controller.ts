import type { Request, Response } from 'express';

import { updateLeaveTypeSchema, type LeaveSchemaType } from './leave.schema.js';
import { LeaveType } from '../database/leave-type.model.js';
import { Leave } from '../database/leave.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';

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

  const payload = updateLeaveTypeSchema.parse(req.body);

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
  const leaveTypes = await LeaveType.find({
    isActive: true,
  }).sort({ createdAt: -1 });

  const normalzied = normalizeDoc(leaveTypes);

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Leave types fetched successfully',
    data: normalzied,
  });
};

// export const applyLeaveController = async (req: Request, res: Response) => {
//   const parsedInput = req.body as LeaveSchemaType;

//   const user = req.user;

//   if (new Date(parsedInput.date) < new Date())
//     throw new ApiError(400, 'Cannot Appy For Past Date.');

//   const leave = await Leave.create({ user: user?.id, ...parsedInput });

//   // return res.status(200).json({
//   //   success: true,
//   //   message: 'Leave applied successfully',
//   //   data: leave,
//   // });

//   return ApiResponse.success(res, {
//     statusCode: 200,
//     message: 'Leave applied successfully',
//     data: null,
//   });
// };
