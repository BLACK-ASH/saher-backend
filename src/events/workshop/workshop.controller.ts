import type { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';
import mongoose from 'mongoose';

import { workshopResponseSchema } from './workshop.schema.js';
import { Program } from '../../database/program.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const { programId } = req.params;
  if (!programId) throw new ApiError(400, 'Id is required in params');

  const program = await Program.findById(programId);

  if (!program) {
    throw new ApiError(404, 'Program not found');
  }

  await Workshop.create({
    ...req.body,
    program: program._id,
  });

  return ApiResponse.success(res, {
    message: 'Workshop is added successfully.',
    data: null,
    statusCode: 201,
  });
};

// Edit a workshop
export const editWorkshop = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedWorkshop = await Workshop.findByIdAndUpdate(id, req.body);

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
  const { id } = req.params;
  const workshop = await Workshop.findOne({
    _id: id,
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
  const workshopId = req.params.workshopId as string;
  if (!mongoose.Types.ObjectId.isValid(workshopId)) {
    throw new ApiError(400, 'Invalid program id');
  }
  const workshop = await Workshop.findOne({
    _id: workshopId,
    isDeleted: false,
  })
    .populate('program', 'title')
    .lean();

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
  const keyword = req.query.keyword?.toString().trim();

  const isDeleted =
    req.query.isDeleted === 'true' ? true : req.query.isDeleted === 'false' ? false : false;

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);

  const skip = (page - 1) * limit;

  const query: QueryFilter<typeof Workshop.schema.obj> = {
    isDeleted,
  };

  if (keyword) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'i');

    const programs = await Program.find({
      title: { $regex: regex },
    }).select('_id');

    const orConditions: QueryFilter<typeof Workshop.schema.obj>[] = [
      { title: { $regex: regex } },
      { description: { $regex: regex } },
    ];

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      orConditions.push({
        programId: convertToObjectId(keyword),
      });
    }

    if (programs.length > 0) {
      orConditions.push({
        programId: {
          $in: programs.map((program) => program._id),
        },
      });
    }

    query.$or = orConditions;
  }

  const [workshops, count] = await Promise.all([
    Workshop.find(query)
      .populate('program', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Workshop.countDocuments(query),
  ]);

  const normalized = normalizeDoc(workshops);
  const parsed = workshopResponseSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: workshops.length ? 'Workshops fetched successfully' : 'No workshops found',
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
