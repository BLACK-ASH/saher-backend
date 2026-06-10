import type { Request, Response } from 'express';

import { participantSchema, updatedParticipantSchema } from './participant.schema.js';
import { Participant } from '../../database/participant.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

//Add participant
export const addParticipant = async (req: Request, res: Response) => {
  req.body = participantSchema.parse(req.body);
  const newParticipant = await Participant.create(req.body);

  return ApiResponse.success(res, {
    message: 'Participant added successfully',
    data: newParticipant,
    statusCode: 200,
  });
};

//Read participant
export const readAllParticipant = async (req: Request, res: Response) => {
  const participants = await Participant.find({ isDeleted: false });

  return ApiResponse.success(res, {
    message: undefined,
    data: participants,
    statusCode: 200,
  });
};

//Edit Participant
export const editParticipant = async (req: Request, res: Response) => {
  req.body = updatedParticipantSchema.parse(req.body);
  const updatedParticipant = await Participant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedParticipant) {
    return ApiResponse.success(res, {
      message: undefined,
      data: undefined,
      statusCode: 404,
    });
  }
  return ApiResponse.success(res, {
    message: 'Participant has been Updated successfully',
    data: updatedParticipant,
    statusCode: 200,
  });
};

//Delete participant
export const deleteParticipant = async (req: Request, res: Response) => {
  const participant = await Participant.findById(req.params.id);

  if (!participant) {
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
