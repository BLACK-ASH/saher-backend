import type { Request, Response } from 'express';

import {
  getSingleWorkshopSchema,
  getWorkshopsFromProgrammeResponseSchema,
  workshopResponseSchema,
} from './workshop.schema.js';
import { Programme } from '../../database/programmes.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const { programmeId } = req.params;
  if (!programmeId) throw new ApiError(400, 'Id is required in params');

  const programme = await Programme.findById(programmeId);

  if (!programme) {
    throw new ApiError(404, 'Programme not found');
  }

  const newWorkshop = await Workshop.create({
    ...req.body,
    programmeId,
  });

  await Programme.findByIdAndUpdate(programmeId, {
    $push: { workshops: newWorkshop._id },
  });

  return ApiResponse.success(res, {
    message: 'Workshop is added successfully.',
    data: null,
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
  ).lean();

  if (!updatedWorkshop) {
    throw new ApiError(404, 'Workshop not found');
  }

  return ApiResponse.success(res, {
    message: 'Workshop has been updated successfully',
    data: null,
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

  await Programme.findByIdAndUpdate(programmeId, {
    $pull: { workshops: workshop._id },
  });

  return ApiResponse.success(res, {
    message: 'Workshop has been soft deleted successfully',
    data: null,
    statusCode: 200,
  });
};

//Undo delete (only works if the workshop is softdeleted)
export const undoDeleteWorkshop = async (req: Request, res: Response) => {
  const workshop = await Workshop.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!workshop) {
    throw new ApiError(404, 'Deleted Workshop not found');
  }

  workshop.isDeleted = false;

  await workshop.save();

  return ApiResponse.success(res, {
    message: 'Workshop has been restored successfully',
    data: null,
    statusCode: 200,
  });
};

/*Permanent Deletion of workshop
export const permanentDeleteWorkshop = async (req: Request, res: Response) => {
  const workshop = await Workshop.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!workshop) {
    throw new ApiError(404, 'Workshop must be soft deleted before permanent deletion');
  }

  await Programme.findByIdAndUpdate(workshop.programmeId, {
    $pull: { workshops: workshop._id },
  });

  await Workshop.findByIdAndDelete(req.params.id);

  return ApiResponse.success(res, {
    message: 'Workshop has been permanently deleted',
    data: null,
    statusCode: 200,
  });
};*/

//Get all Workshops
export const getWorkshopsFromProgramme = async (req: Request, res: Response) => {
  const { programmeId } = req.params;
  const programme = await Programme.findById(programmeId);

  if (!programme) {
    throw new ApiError(404, 'Programme not found');
  }

  const workshop = await Workshop.find({
    programmeId: req.params.programmeId,
    isDeleted: false,
  }).lean();

  if (workshop.length === 0) {
    throw new ApiError(404, 'Workshops not found');
  }

  const normalized = normalizeDoc(workshop);
  const parsed = getWorkshopsFromProgrammeResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Workshops fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};

//Get a single Workshop
export const getSingleWorkshop = async (req: Request, res: Response) => {
  const workshop = await Workshop.findOne({
    _id: req.params.workshopId,
    isDeleted: false,
  }).lean();

  if (!workshop) {
    throw new ApiError(404, 'Workshop not found');
  }

  const normalized = normalizeDoc(workshop);
  const parsed = getSingleWorkshopSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Workshop fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};

//Search for workshop
export const getWorkshopByKeyword = async (req: Request, res: Response) => {
  const keyword = req.query.keyword as string;

  // Search by name, brand, or category using case-insensitive regex
  const regex = new RegExp(keyword, 'i');

  const workshop = await Workshop.find({
    $or: [{ title: { $regex: regex } }, { description: { $regex: regex } }],
  })
    .limit(5)
    .lean(); // Return top 5 suggestions

  if (workshop.length === 0) {
    return ApiResponse.success(res, {
      message: 'No workshops found',
      data: [],
      statusCode: 200,
    });
  }

  const normalized = normalizeDoc(workshop);
  const parsed = getWorkshopsFromProgrammeResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Workshop fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};
