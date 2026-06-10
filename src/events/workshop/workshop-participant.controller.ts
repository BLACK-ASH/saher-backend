import type { Request, Response } from 'express';

import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

//Add participant to workshop
export const addParticipantToWorkshop = async (req: Request, res: Response) => {
  const { participantId } = req.body;
  const { workshopId } = req.params;

  const workshop = await Workshop.findByIdAndUpdate(workshopId, {
    $addToSet: { participants: participantId },
  });

  if (!workshop) throw new ApiError(404, 'Workshop not found');

  return ApiResponse.success(res, {
    message: 'Participant added successfully',
    data: workshop,
    statusCode: 200,
  });
};

//Remove participant from worskhop
export const removeParticipantFromWorkshop = async (req: Request, res: Response) => {
  const { workshopId, participantId } = req.params;

  const workshop = await Workshop.findByIdAndUpdate(
    workshopId,
    {
      $pull: { participants: { $in: participantId } },
    },
    { new: true },
  );

  if (!workshop) throw new ApiError(404, 'Workshop not found');

  return ApiResponse.success(res, {
    message: 'Participant removed successfully',
    data: workshop,
    statusCode: 200,
  });
};
