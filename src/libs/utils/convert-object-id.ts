import { Types } from 'mongoose';

import { ApiError } from '../class/api-error.js';

export const convertToObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid ObjectId.');
  return new Types.ObjectId(id);
};
