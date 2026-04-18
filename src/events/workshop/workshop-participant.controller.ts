import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { Request, Response } from 'express';

//Add participant to workshop
export const addParticipantToWorkshop = async (req: Request, res: Response) => {
  const { workshopId, participantId } = req.body;

  const workshop = await Workshop.findByIdAndUpdate(
    workshopId,
    {
      $addToSet: { participants: participantId },
    },
    { new: true },
  );

  if (!workshop) throw new ApiError(404, 'Workshop not found');

  return res.status(200).json({
    success: true,
    message: 'Participant added successfully',
    data: workshop,
  });
};

//Remove participant from worskhop
export const removeParticipantFromWorkshop = async (req: Request, res: Response) => {
  const { workshopId, participantId } = req.body;

  const workshop = await Workshop.findByIdAndUpdate(
    workshopId,
    {
      $pull: { participants: participantId },
    },
    { new: true },
  );

  if (!workshop) throw new ApiError(404, 'Workshop not found');

  return res.status(200).json({
    success: true,
    message: 'Participant removed successfully',
    data: workshop,
  });
};
