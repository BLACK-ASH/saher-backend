import type { Request, Response } from 'express';
import z from 'zod';

import { getLeaveApplicationSchema, getLeaveBalanceSchema } from './leave.schema.js';
import { LeaveBalance } from '../database/leave-balance.model.js';
import { LeaveType } from '../database/leave-type.model.js';
import { Leave } from '../database/leave.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { convertToObjectId } from '../libs/utils/convert-object-id.js';
import { recordLeaveUsage } from '../libs/utils/leave-logs.js';
import { calculateLeaveDays, validateLeaveApplication } from '../libs/utils/leave.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';

export const createLeaveTypeController = async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(401, 'Unauthorized');
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

  // const leaveType = await LeaveType.findOne({
  //   code: payload.leaveTypeCode.toUpperCase(),
  //   isActive: true,
  // });

  const leaveType = await LeaveType.findById(payload.leaveTypeCode);
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
    leaveTypeCode: payload.leaveTypeCode,
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
    _id: updatedLeaveTypeCode,
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

  const updateData = {
    ...(payload.startDate && {
      startDate: payload.startDate,
    }),
    ...(payload.endDate && {
      endDate: payload.endDate,
    }),
    ...(payload.leaveTypeCode && {
      leaveTypeCode: payload.leaveTypeCode,
    }),
    ...(payload.reason && {
      reason: payload.reason,
    }),
    ...(payload.proof !== undefined && {
      proof: payload.proof,
    }),
  };
  const updatedLeave = await Leave.findByIdAndUpdate(
    id,
    {
      $set: {
        ...updateData,
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

  const leaveCode = (await LeaveType.findById(leave.leaveTypeCode))?.code;
  if (!leaveCode) throw new ApiError(400, 'SomeThing went Wrong');
  if (payload.status === 'approved') {
    await recordLeaveUsage({
      userId: leave.user.toString(),
      leaveTypeCode: leaveCode,
      year: leave.startDate.getFullYear().toString(),
      days: leave.totalDays,
      performedBy: reviewerId,
      leaveId: leave._id.toString(),
    });
  }

  return ApiResponse.success(res, {
    statusCode: 200,
    message: `Leave application ${payload.status} successfully`,
    data: leave,
  });
};

export const getLeaveApplicationController = async (req: Request, res: Response) => {
  const record = await Leave.find({ user: req.user?.id }).lean();

  if (record.length === 0) {
    return ApiResponse.success(res, {
      message: 'You have no Leave Application',
      statusCode: 200,
      data: null,
    });
  }

  const normalized = normalizeDoc(record);

  const parsed = z.array(getLeaveApplicationSchema).parse(normalized);

  return ApiResponse.success(res, {
    message: "User 's leave applications fetchded successfully",
    data: parsed,
    statusCode: 200,
  });
};

export const getAllLeaveApplicationController = async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role === 'user' || role === 'intern') {
    throw new ApiError(400, 'Only Admins and managers are allowed to access this end point ');
  }
  const record = await Leave.find().lean();

  const normalized = normalizeDoc(record);
  const parsed = z.array(getLeaveApplicationSchema).parse(normalized);

  return ApiResponse.success(res, {
    message: 'All leave applications fetchded successfully',
    data: parsed,
    statusCode: 200,
  });
};

// ---------------------Leave Balance ---------------

// export const createLeaveBalance = async (
//   req: Request,
//   res: Response,
// ) => {

//     const { user, year } = req.body;

//     const existing = await LeaveBalance.findOne({
//       user,
//       year,
//     });

//     if (existing) throw new ApiError(409, 'Leave balance already exists',);

//     const leaveBalance =
//       await LeaveBalance.create({
//         user,
//         year,
//       });

//       return ApiResponse.success(res,{message : " Leave Balance created " , statusCode : 201})
//   }

// export const consumeLeave = async (
//   req: Request,
//   res: Response,
// ) => {

//   const {
//     userId,
//     year,
//     leaveTypeCode,
//     days,
//   } = req.body;

//   const leaveBalance =
//   await LeaveBalance.findOneAndUpdate(
//     {
//         user: userId,
//         year,
//       },
//       {
//         $inc: {
//           [`used.${leaveTypeCode}`]: days,
//         },
//       },
//       {
//         new: true,
//         upsert: true,
//       },
//     );

//     return res.json(leaveBalance);

//   };

export const getLeaveBalance = async (req: Request, res: Response) => {
  // const { userId, year } = req.params;
  const userId = req.user?.id;

  const year = new Date().getFullYear().toLocaleString();
  // const year = '2027';
  const leaveBalance = await LeaveBalance.findOne({
    user: userId,
    year,
  }).lean();

  if (!leaveBalance) {
    throw new ApiError(404, 'Leave balance not found');
  }

  const normalized = normalizeDoc(leaveBalance);
  const parsed = getLeaveBalanceSchema.parse(normalized);
  return ApiResponse.success(res, {
    message: 'your leave Balance',
    data: parsed,
    statusCode: 200,
  });
};
