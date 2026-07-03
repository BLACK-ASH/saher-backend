import type { Request, Response } from 'express';

import { getProgrammesSchema, getSingleProgrammeSchema } from './programmes.schema.js';
import { Participant } from '../../database/participant.model.js';
import { Programme } from '../../database/programmes.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// Add a programme
export const addProgramme = async (req: Request, res: Response) => {
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

  const newProgramme = await Programme.create(req.body);

  return ApiResponse.success(res, {
    message: 'Programme has been added successfully.',
    data: null,
    statusCode: 201,
  });
};

//Edit a programme
export const editProgramme = async (req: Request, res: Response) => {
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
  const updatedProgramme = await Programme.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
  ).lean();

  if (!updatedProgramme) {
    throw new ApiError(404, 'Programme not found');
  }

  return ApiResponse.success(res, {
    message: 'Programme has been updated successfully',
    data: null,
    statusCode: 200,
  });
};

//Soft delete a programme
export const deleteProgramme = async (req: Request, res: Response) => {
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

//Undo delete (only works if the programme is soft-deleted)
export const undoDeleteProgramme = async (req: Request, res: Response) => {
  const programme = await Programme.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!programme) {
    throw new ApiError(404, 'Deleted programme not found');
  }

  programme.isDeleted = false;
  await programme.save();

  return ApiResponse.success(res, {
    message: 'Programme has been restored successfully',
    data: null,
    statusCode: 200,
  });
};

/*Permanent Deletion of programme
export const permanentDeleteProgramme = async (req: Request, res: Respo  nse) => {
  const programme = await Programme.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!programme) {
    throw new ApiError(404, 'Programme must be soft deleted before permanent deletion');
  }

  await Programme.findByIdAndDelete(req.params.id);

  return ApiResponse.success(res, {
    message: 'Programme has been permanently deleted',
    data: null,
    statusCode: 200,
  });
};
*/

//Get all Programmes
export const getProgrammes = async (req: Request, res: Response) => {
  const programme = await Programme.find({
    isDeleted: false,
  })
    .populate({
      path: 'participants',
      match: { isDeleted: false },
    })
    .lean();

  if (programme.length === 0) {
    return ApiResponse.success(res, {
      message: 'Programs not found',
      data: [],
      statusCode: 200,
    });
  }

  const normalized = normalizeDoc(programme);
  const parsed = getProgrammesSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Programmes fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};

//Get a single Programme
export const getSingleProgramme = async (req: Request, res: Response) => {
  const programme = await Programme.findOne({
    _id: req.params.id,
    isDeleted: false,
  })
    .populate({
      path: 'participants',
      match: { isDeleted: false },
    })
    .lean();

  if (!programme) {
    throw new ApiError(404, 'Programme not found');
  }

  const normalized = normalizeDoc(programme);
  const parsed = getSingleProgrammeSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Programme fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};

//Searching a programme using case-insensitive input
