import type { Request, Response } from 'express';

import { Programme } from '../../database/programmes.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

// Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const { programmeId } = req.params;
  const newWorkshop = await Workshop.create({
    ...req.body,
    programmeId,
  });

  await Programme.findByIdAndUpdate(programmeId, {
    $push: { workshops: newWorkshop._id },
  });

  return ApiResponse.success(res, {
    message: 'Workshop is added successfully.',
    data: newWorkshop,
    statusCode: 201,
  });
};

// Edit a workshop
export const editWorkshop = async (req: Request, res: Response) => {
  const { programmeId, id } = req.params;
  const updatedWorkshop = await Workshop.findOneAndUpdate(
    {
      _id: id,
      programmeId: programmeId,
      isDeleted: false,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedWorkshop) {
    throw new ApiError(404, 'Workshop not found');
  }

  return ApiResponse.success(res, {
    message: 'Workshop has been updated successfully',
    data: updatedWorkshop,
    statusCode: 200,
  });
};

// Soft delete a workshop
export const deleteWorkshop = async (req: Request, res: Response) => {
  const { programmeId, id } = req.params;
  const workshop = await Workshop.findOne({
    _id: id,
    programmeId,
    isDeleted: false,
  });

  if (!workshop) {
    throw new ApiError(404, 'Workshop not found');
  }

  workshop.isDeleted = true;
  await workshop.save();

  return ApiResponse.success(res, {
    message: 'Workshop has been soft deleted successfully',
    data: null,
    statusCode: 200,
  });
};
