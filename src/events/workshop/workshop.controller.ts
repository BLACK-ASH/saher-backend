import type { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';
import mongoose from 'mongoose';

import { workshopResponseSchema } from './workshop.schema.js';
import { Program } from '../../database/program.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const { programmeId } = req.params;
  if (!programmeId) throw new ApiError(400, 'Program Id is Required');

  const programme = await Program.findById(programmeId);

  if (!programme) {
    throw new ApiError(404, 'Program not found');
  }

  const newWorkshop = await Workshop.create({
    ...req.body,
    programmeId,
  });

  await Program.findByIdAndUpdate(programmeId, {
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

  await Program.findByIdAndUpdate(programmeId, {
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
  const parsed = workshopResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Workshop fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};

//Get workshops
export const getWorkshops = async (req: Request, res: Response) => {
  const programmeId = req.query.programmeId as string | undefined;
  const keyword = req.query.keyword as string | undefined;
  const isDeleted = req.query.isDeleted as string | undefined;

  const query: QueryFilter<typeof Workshop.schema.obj> = {};

  if (isDeleted === 'true') {
    query.isDeleted = true;
  } else if (isDeleted === 'false') {
    query.isDeleted = false;
  }

  if (programmeId) {
    if (!mongoose.Types.ObjectId.isValid(programmeId)) {
      throw new ApiError(400, 'Invalid programme id');
    }

    query.programmeId = programmeId;
  }

  if (keyword?.trim()) {
    const escapedKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regex = new RegExp(escapedKeyword, 'i');

    query.$or = [{ title: { $regex: regex } }, { description: { $regex: regex } }];
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const [workshops, count] = await Promise.all([
    Workshop.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Workshop.countDocuments(query),
  ]);

  const normalize = normalizeDoc(workshops);

  const parsed = workshopResponseSchema.array().parse(normalizeDoc(normalize));

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
