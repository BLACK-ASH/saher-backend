import type { Request, Response } from 'express';

import { CreateProgrammeInputType, UpdateProgrammeInputType } from './programmes.schema.js';
import { Programme } from '../../database/programmes.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

// Add a programme
export const addProgramme = async (req: Request, res: Response) => {
  const newProgramme = await Programme.create(req.body);

  return ApiResponse.success(res, {
    message: 'Programme has been added successfully.',
    data: newProgramme,
    statusCode: 201,
  });
};

//Edit a programme
export const editProgramme = async (req: Request, res: Response) => {
  const updatedProgramme = await Programme.findOneAndUpdate(
    {
      _id: req.params.id,
      isDeleted: false,
    },
    req.body,
    { new: false, runValidators: false },
  );

  if (!updatedProgramme) {
    throw new ApiError(404, 'Programme not found');
  }

  return ApiResponse.success(res, {
    message: 'Programme has been updated successfully',
    data: updatedProgramme,
  });
};

//Soft delete a programme
export const deleteProgram = async (req: Request, res: Response) => {
  const programme = await Programme.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!programme) {
    throw new ApiError(404, 'Programme not found');
  }

  programme.isDeleted = true;
  await programme.save();

  return ApiResponse.success(res, {
    message: 'Programme has been soft deleted successfully',
    data: null,
    statusCode: 200,
  });
};
