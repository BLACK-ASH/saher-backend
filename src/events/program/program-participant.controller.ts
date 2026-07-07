import type { Request, Response } from 'express';

import { Participant } from '../../database/participant.model.js';
import { Program } from '../../database/program.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const getParticipantsFromProgram = async (req: Request, res: Response) => {
  const { programId } = req.params;

  const program = await Program.findById(programId).lean();

  if (!program) throw new ApiError(404, 'Program not found');

  return ApiResponse.success(res, {
    message: 'Participants get successfully',
    data: program.participants,
    statusCode: 200,
  });
};

export const addParticipantsToProgram = async (req: Request, res: Response) => {
  const { programId } = req.params;
  const participantIds = req.body as string[];

  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw new ApiError(400, 'participantIds must be a non-empty array');
  }

  const participants = await Participant.find({
    _id: { $in: participantIds },
    isDeleted: false,
  }).select('_id');

  if (participants.length !== participantIds.length) {
    throw new ApiError(404, 'One or more participants were not found');
  }

  const program = await Program.findByIdAndUpdate(programId, {
    $addToSet: {
      participants: {
        $each: participantIds,
      },
    },
  });

  if (!program) {
    throw new ApiError(404, 'Program not found');
  }

  return ApiResponse.success(res, {
    message: 'Participants added successfully',
    data: null,
    statusCode: 200,
  });
};

//Remove participant from worskhop
export const removeParticipantFromProgram = async (req: Request, res: Response) => {
  const { programId, participantId } = req.params;

  const program = await Program.findByIdAndUpdate(programId, {
    $pull: { participants: participantId },
  });

  if (!program) throw new ApiError(404, 'Program not found');

  return ApiResponse.success(res, {
    message: 'Participant removed successfully',
    data: null,
    statusCode: 200,
  });
};
