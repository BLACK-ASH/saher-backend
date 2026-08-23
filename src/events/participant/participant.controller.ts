import type { Request, Response } from 'express';

import {
  participantResponseSchema,
  participantSchema,
  updatedParticipantSchema,
} from './participant.schema.js';
import { Participant } from '../../database/participant.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

//Add participant
export const addParticipantController = async (req: Request, res: Response) => {
  req.body = participantSchema.parse(req.body);
  await Participant.create(req.body);

  return ApiResponse.success(res, {
    message: 'Participant added successfully',
    data: null,
    statusCode: 200,
  });
};

//Edit Participant
export const editParticipantController = async (req: Request, res: Response) => {
  req.body = updatedParticipantSchema.parse(req.body);
  const updatedParticipant = await Participant.findByIdAndUpdate(req.params.id, req.body).lean();
  if (!updatedParticipant) {
    throw new ApiError(404, 'Participant Not Found.');
  }

  return ApiResponse.success(res, {
    message: 'Participant has been Updated successfully',
    data: null,
    statusCode: 200,
  });
};

// Soft Delete participant
export const deleteParticipantController = async (req: Request, res: Response) => {
  const participant = await Participant.findById(req.params.id);

  if (!participant || participant.isDeleted === true) {
    throw new ApiError(404, 'Participant not found');
  }

  participant.isDeleted = true;
  await participant.save();

  return ApiResponse.success(res, {
    message: 'Participant has been soft deleted successfully',
    data: null,
    statusCode: 200,
  });
};

// Undo soft deleted Participants
export const undoDeleteParticipantController = async (req: Request, res: Response) => {
  const participants = await Participant.findById(req.params);

  if (!participants) throw new ApiError(404, 'Participant not found');

  if (participants?.isDeleted === false) {
    return ApiResponse.success(res, {
      message: "Participants isn't deleted yet",
      data: null,
      statusCode: 201,
    });
  }

  if (participants?.isDeleted === true) {
    participants.isDeleted = false;
    await participants.save();
  }

  return ApiResponse.success(res, {
    message: 'Participants is restore successfully',
    data: null,
    statusCode: 201,
  });
};

//Get Participants by ID
export const getParticipantByIdController = async (req: Request, res: Response) => {
  const participants = await Participant.findById(req.params.id as string)
    .populate('image')
    .populate('document')
    .lean();

  const normalized = normalizeDoc(participants);
  const parsed = participantResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Participants By Id',
    data: parsed,
    statusCode: 200,
  });
};

//Get participants
export const getParticipants = async (req: Request, res: Response) => {
  const keyword = req.query.keyword as string;
  const isDeleted = req.query.isDeleted as string | undefined;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {
    ...(isDeleted !== undefined && {
      isDeleted: isDeleted === 'true',
    }),
    ...(keyword && {
      name: {
        $regex: new RegExp(keyword, 'i'),
      },
    }),
  };

  const participants = await Participant.find(query)
    .sort({ createdAt: -1 })
    .populate('image')
    .populate('document')
    .skip(skip)
    .limit(limit)
    .lean();

  const count = await Participant.countDocuments(query);

  if (participants.length === 0) {
    return ApiResponse.success(res, {
      message: 'No participants found',
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

  const normalized = normalizeDoc(participants);
  const parsed = participantResponseSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: keyword
      ? 'Participants matching keyword fetched successfully'
      : 'Participants fetched successfully',
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
