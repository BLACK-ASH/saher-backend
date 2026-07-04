import type { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';

import {
  getSingleWorkshopSchema,
  getWorkshopsFromProgrammeResponseSchema,
} from './workshop.schema.js';
import { Program } from '../../database/program.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const { programId } = req.params;
  if (!programId) throw new ApiError(400, 'Id is required in params');

  const program = await Program.findById(programId);

  if (!program) {
    throw new ApiError(404, 'Program not found');
  }

  const newWorkshop = await Workshop.create({
    ...req.body,
    program,
  });

  await Program.findByIdAndUpdate(programId, {
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
  const { programId, id } = req.params;
  const updatedWorkshop = await Workshop.findOneAndUpdate(
    {
      _id: id,
      program: programId,
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
  const { programId, id } = req.params;
  const workshop = await Workshop.findOne({
    _id: id,
    program: programId,
    isDeleted: false,
  });

  if (!workshop) {
    throw new ApiError(404, 'Workshop not found');
  }

  workshop.isDeleted = true;
  await workshop.save();

  await Program.findByIdAndUpdate(programId, {
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

//Get workshops
export const getWorkshops = async (req: Request, res: Response) => {
  const programId = req.query.program as string;
  const keyword = req.query.keyword as string;
  const all = req.query.all === 'true';

  const isDeleted = req.query.isDeleted as string;

  const query: QueryFilter<typeof Workshop.schema.obj> = {};

  if (isDeleted === 'true') {
    query.isDeleted = true;
  } else if (isDeleted === 'false') {
    query.isDeleted = false;
  }

  if (programId) {
    const program = await Program.findById(programId);

    if (!program) {
      throw new ApiError(404, 'Program not found');
    }

    query.program = program;
  }

  if (keyword) {
    const regex = new RegExp(keyword, 'i');

    query.$or = [{ title: { $regex: regex } }, { description: { $regex: regex } }];
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let workshopQuery = Workshop.find(query).sort({ createdAt: -1 });

  if (!all) {
    workshopQuery = workshopQuery.skip(skip).limit(limit);
  }

  const workshops = await workshopQuery.lean();

  const count = await Workshop.countDocuments(query);

  const normalized = normalizeDoc(workshops);
  const parsed = getWorkshopsFromProgrammeResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Workshops fetched successfully',
    data: parsed,
    statusCode: 200,
    meta: {
      page,
      limit,
      count,
      total: Math.ceil(count / limit),
    },
  });
};
