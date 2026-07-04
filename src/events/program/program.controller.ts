import type { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';

import { programResponseSchema } from './program.schema.js';
import { Participant } from '../../database/participant.model.js';
import { Program } from '../../database/program.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// Add a program
export const addProgram = async (req: Request, res: Response) => {
  if (req.body.participants?.length) {
    const participants = await Participant.find({
      _id: { $in: req.body.participants ?? [] },
      isDeleted: false,
    }).select('_id');

    if (participants.length !== (req.body.participants?.length ?? 0)) {
      throw new ApiError(400, 'One or more participant IDs are invalid');
    }
  }

  if (req.body.workshops?.length) {
    const workshops = await Workshop.find({
      _id: { $in: req.body.workshops ?? [] },
      isDeleted: false,
    }).select('_id');

    if (workshops.length !== (req.body.workshops?.length ?? 0)) {
      throw new ApiError(400, 'One or more workshop IDs are invalid');
    }
  }

  await Program.create(req.body);

  return ApiResponse.success(res, {
    message: 'Program has been added successfully.',
    data: null,
    statusCode: 201,
  });
};

//Edit a program
export const editProgram = async (req: Request, res: Response) => {
  if (req.body.participants) {
    const participantCount = await Participant.countDocuments({
      _id: { $in: req.body.participants },
      isDeleted: false,
    });

    if (participantCount !== req.body.participants.length) {
      throw new ApiError(400, 'One or more participant IDs are invalid');
    }
  }

  if (req.body.workshops) {
    const workshopCount = await Workshop.countDocuments({
      _id: { $in: req.body.workshops },
      isDeleted: false,
    });

    if (workshopCount !== req.body.workshops.length) {
      throw new ApiError(400, 'One or more workshop IDs are invalid');
    }
  }
  const updatedProgram = await Program.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
  ).lean();

  if (!updatedProgram) {
    throw new ApiError(404, 'Program not found');
  }

  return ApiResponse.success(res, {
    message: 'Program has been updated successfully',
    data: null,
    statusCode: 200,
  });
};

//Soft delete a program
export const deleteProgram = async (req: Request, res: Response) => {
  const program = await Program.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!program) {
    throw new ApiError(404, 'Program not found');
  }

  program.isDeleted = true;
  await program.save();

  return ApiResponse.success(res, {
    message: 'Program has been soft deleted successfully',
    data: null,
    statusCode: 200,
  });
};

//Undo delete (only works if the program is soft-deleted)
export const undoDeleteProgram = async (req: Request, res: Response) => {
  const program = await Program.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!program) {
    throw new ApiError(404, 'Deleted program not found');
  }

  program.isDeleted = false;
  await program.save();

  return ApiResponse.success(res, {
    message: 'Program has been restored successfully',
    data: null,
    statusCode: 200,
  });
};

//Get a single Program
export const getSingleProgram = async (req: Request, res: Response) => {
  const program = await Program.findOne({
    _id: req.params.id,
    isDeleted: false,
  })
    .populate({
      path: 'participants',
      match: { isDeleted: false },
    })
    .lean();

  if (!program) {
    throw new ApiError(404, 'Program not found');
  }

  const normalized = normalizeDoc(program);
  const parsed = programResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Program fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};

//Get programs
export const getPrograms = async (req: Request, res: Response) => {
  const keyword = req.query.keyword as string;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const isDeleted = req.query.isDeleted as string;

  const query: QueryFilter<typeof Program.schema.obj> = {};

  if (isDeleted === 'true') {
    query.isDeleted = true;
  } else if (isDeleted === 'false') {
    query.isDeleted = false;
  }

  //Search program title/description
  if (keyword) {
    const regex = new RegExp(keyword, 'i');

    query.$or = [{ title: { $regex: regex } }, { description: { $regex: regex } }];
  }

  const programs = await Program.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

  const count = await Program.countDocuments(query);

  if (programs.length === 0) {
    return ApiResponse.success(res, {
      message: 'No programs found',
      data: [],
      statusCode: 200,
      meta: {
        page,
        limit,
        count: 0,
        total: 0,
      },
    });
  }

  const normalized = normalizeDoc(programs);
  const parsed = programResponseSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: keyword
      ? 'Programs matching keyword fetched successfully'
      : 'Programs fetched successfully',
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
