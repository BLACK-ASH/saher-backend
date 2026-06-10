import type { Request, Response } from 'express';

import { Programme } from '../../database/programmes.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

//Add participant to workshop
export const addParticipantToProgramme = async (req: Request, res: Response) => {
  const { participantId } = req.body;
  const { programmeId } = req.params;

  const programme = await Programme.findByIdAndUpdate(
    programmeId,
    {
      $addToSet: { participants: participantId },
    },
    { new: true },
  );

  if (!programme) throw new ApiError(404, 'Programme not found');

  return ApiResponse.success(res, {
    message: 'Participant added successfully',
    data: programme,
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
    data: programme,
    statusCode: 200,
  });
};
