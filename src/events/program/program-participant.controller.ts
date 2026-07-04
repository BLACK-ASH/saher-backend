import type { Request, Response } from 'express';

import { Participant } from '../../database/participant.model.js';
import { Program } from '../../database/program.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const addParticipantToProgram = async (req: Request, res: Response) => {
  const { participantId, participantData } = req.body;
  const { programId } = req.params;
  let finalParticipantId = participantId;

  if (!finalParticipantId) {
    const newParticipant = await Participant.create(participantData);
    finalParticipantId = newParticipant._id.toString();
  }

  const participant = await Participant.findOne({
    _id: finalParticipantId,
    isDeleted: false,
  });

  if (!participant) {
    throw new ApiError(404, 'Participant not found');
  }

  await Program.findByIdAndUpdate(programId, {
    $addToSet: { participants: finalParticipantId },
  });

  return ApiResponse.success(res, {
    message: 'Participant created and linked successfully',
    data: null,
    statusCode: 200,
  });
};

//Remove participant from worskhop
export const removeParticipantFromProgram = async (req: Request, res: Response) => {
  const { programId, participantId } = req.params;

  const program = await Program.findByIdAndUpdate(
    programId,
    {
      $pull: { participants: participantId },
    },
    { new: true },
  );

  if (!program) throw new ApiError(404, 'Program not found');

  return ApiResponse.success(res, {
    message: 'Participant removed successfully',
    data: null,
    statusCode: 200,
  });
};
