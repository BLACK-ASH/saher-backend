import type { Request, Response } from 'express';

import {
  participantSchema,
  participantsResponsiveSchema,
  updatedParticipantSchema,
} from './participant.schema.js';
import { Participant } from '../../database/participant.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

//Add participant
export const addParticipant = async (req: Request, res: Response) => {
  req.body = participantSchema.parse(req.body);
  const newParticipant = await Participant.create(req.body);

  return ApiResponse.success(res, {
    message: 'Participant added successfully',
    data: null,
    statusCode: 200,
  });
};

//Edit Participant
export const editParticipant = async (req: Request, res: Response) => {
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

//Delete participant
export const deleteParticipant = async (req: Request, res: Response) => {
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

//Get all participant
export const getAllParticipant = async (req: Request, res: Response) => {
  const participants = await Participant.find({ isDeleted: false }).lean();

  const normalized = normalizeDoc(participants);
  const parsed = participantsResponsiveSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'All Participants List',
    data: parsed,
    statusCode: 200,
  });
};
