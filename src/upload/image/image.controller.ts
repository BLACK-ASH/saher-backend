import type { Request, Response } from 'express';

import { processAndSaveImage } from './image.service.js';
import { Media } from '../../database/media-upload.model.js';
import { ApiError } from '../../libs/class/api-error.js';

export const uploadImageController = async (req: Request, res: Response) => {
  const file = req.file;
  const name = req.body?.name;

  if (req.fileValidationError)
    throw new ApiError(400, 'File Validation Failed.', req.fileValidationError);
  if (!file) throw new ApiError(400, 'No File Provided.');
  if (!name) throw new ApiError(400, 'No Alt Name Provided.');

  const image = await processAndSaveImage(file);

  const dbImage = await Media.create({ src: image?.imageUrl, alt: name });
  if (!dbImage) throw new ApiError(400, 'Image Not Saved.');

  const response = {
    success: true,
    message: 'Image Upload Successfully',
    file: {
      id: dbImage._id,
      fileName: image.fileName,
      url: image.imageUrl,
      size: image.size,
      width: image.width,
      height: image.height,
      mimetype: image.mimetype,
    },
  };

  return res.status(201).json(response);
};
