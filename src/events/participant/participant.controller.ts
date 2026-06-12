import type { Request, Response } from 'express';

import {
  getAllParticipantSchema,
  getParticipantByIdSchema,
  participantSchema,
  participantsResponsiveSchema,
  updatedParticipantSchema,
} from './participant.schema.js';
import { Participant } from '../../database/participant.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

//Add participant
export const addParticipantController = async (req: Request, res: Response) => {
  req.body = participantSchema.parse(req.body);
  const newParticipant = await Participant.create(req.body);

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
    return ApiResponse.success(res, {
      message: undefined,
      data: undefined,
      statusCode: 404,
    });
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

// Permanent delete participant
export const permanentDeleteParticipantController = async (req: Request, res: Response) => {
  const participants = await Participant.findById(req.params);

  if (!participants) throw new ApiError(404, 'Participant not found');

  if (participants?.isDeleted === false) {
    return ApiResponse.success(res, {
      message: "Participants isn't soft deleted yet",
      data: null,
      statusCode: 201,
    });
  }

  if (participants?.isDeleted === true) {
    await Participant.findByIdAndDelete(participants);
  }

  return ApiResponse.success(res, {
    message: 'Participants is deleted successfully',
    data: null,
    statusCode: 201,
  });
};

//Get all participant
export const getAllParticipantController = async (req: Request, res: Response) => {
  const participants = await Participant.find({ isDeleted: false }).lean();

  const normalized = normalizeDoc(participants);
  const parsed = getAllParticipantSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'All Participants List',
    data: parsed,
    statusCode: 200,
  });
};

// Get Participants by ID
export const getParticipantByIdController = async (req: Request, res: Response) => {
  const participants = await Participant.findOne(req.params, { isDeleted: false }).lean();

  const normalized = normalizeDoc(participants);
  const parsed = getParticipantByIdSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Participants By Id',
    data: parsed,
    statusCode: 200,
  });
};
