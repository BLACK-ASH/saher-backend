import type { Request, Response } from 'express';

import { createProgrammeParticipantsResponseSchema } from './programmes.schema.js';
import { Participant } from '../../database/participant.model.js';
import { Programme } from '../../database/programmes.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

export const addParticipantToProgramme = async (req: Request, res: Response) => {
  const { participantId, participantData } = req.body;
  const { programmeId } = req.params;

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

  await Programme.findByIdAndUpdate(programmeId, {
    $addToSet: { participants: finalParticipantId },
  });

  return ApiResponse.success(res, {
    message: 'Participant created and linked successfully',
    data: null,
    statusCode: 200,
  });
};

//Remove participant from worskhop
export const removeParticipantFromProgramme = async (req: Request, res: Response) => {
  const { programmeId, participantId } = req.params;

  const programme = await Programme.findByIdAndUpdate(
    programmeId,
    {
      $pull: { participants: participantId },
    },
    { new: true },
  );

  if (!programme) throw new ApiError(404, 'Programme not found');

  return ApiResponse.success(res, {
    message: 'Participant removed successfully',
    data: null,
    statusCode: 200,
  });
};
