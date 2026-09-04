import fs from 'fs/promises';
import path from 'path';

import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import { processAndSaveImage } from './image.service.js';
import { Media } from '../../database/media-upload.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const uploadBulkImagesController = async (req: Request, res: Response) => {
  const files = req.files;

  if (req.fileValidationError)
    throw new ApiError(400, 'File Validation Failed.', req.fileValidationError);
  if (!Array.isArray(files) || files.length === 0) throw new ApiError(400, 'No Files Provided.');

  // alt falls back to each file's original name — bulk uploads carry no shared `name` field
  const uploaded: Array<{
    id: Types.ObjectId;
    fileName: string;
    alt: string;
    src: string;
    size: number;
    mimetype: string;
  }> = [];
  const writtenUrls: string[] = [];

  try {
    for (const file of files) {
      const image = await processAndSaveImage(file);
      writtenUrls.push(image.imageUrl);

      const dbImage = await Media.create({ src: image.imageUrl, alt: file.originalname });

      uploaded.push({
        id: dbImage._id,
        fileName: image.fileName,
        alt: file.originalname,
        src: image.imageUrl,
        size: image.size,
        mimetype: image.mimetype,
      });
    }
  } catch (error) {
    // Any failure — remove every file written so far instead of orphaning them on disk
    await Promise.all(
      writtenUrls.map((url) =>
        fs.unlink(path.join(process.cwd(), 'public', url)).catch(() => undefined),
      ),
    );
    throw error;
  }

  return ApiResponse.success(res, {
    message: 'Images Upload Successfully',
    statusCode: 201,
    data: uploaded,
  });
};

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
      alt: name,
      src: image.imageUrl,
      size: image.size,
      width: image.width,
      height: image.height,
      mimetype: image.mimetype,
    },
  });
};
