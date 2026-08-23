import fs from 'fs/promises';
import path from 'path';

import type { Request, Response } from 'express';

import { processAndSaveImage } from './image.service.js';
import { Media } from '../../database/media-upload.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const uploadImageController = async (req: Request, res: Response) => {
  const file = req.file;
  const name = req.body?.name;

  if (req.fileValidationError)
    throw new ApiError(400, 'File Validation Failed.', req.fileValidationError);
  if (!file) throw new ApiError(400, 'No File Provided.');
  if (!name) throw new ApiError(400, 'No Alt Name Provided.');

  const image = await processAndSaveImage(file);

  let dbImage;
  try {
    dbImage = await Media.create({ src: image?.imageUrl, alt: name });
  } catch (error) {
    // DB write failed — remove the just-written file instead of orphaning it on disk
    await fs
      .unlink(path.join(process.cwd(), 'public', image.imageUrl))
      .catch(() => undefined);
    throw error;
  }

  return ApiResponse.success(res, {
    message: 'Image Upload Successfully',
    statusCode: 201,
    data: {
      id: dbImage._id,
      fileName: image.fileName,
      url: image.imageUrl,
      size: image.size,
      width: image.width,
      height: image.height,
      mimetype: image.mimetype,
    },
  });
};
