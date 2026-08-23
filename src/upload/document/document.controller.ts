import fs from 'fs/promises';
import path from 'path';

import type { Request, Response } from 'express';

import { saveDocument } from './document.service.js';
import { Media } from '../../database/media-upload.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const uploadDocumentController = async (req: Request, res: Response) => {
  const file = req.file;
  const name = req.body?.name;

  if (req.fileValidationError)
    throw new ApiError(400, 'File Validation Failed.', req.fileValidationError);
  if (!file) throw new ApiError(400, 'No File Provided.');
  if (!name) throw new ApiError(400, 'No Alt Name Provided.');

  const document = await saveDocument(file);

  let dbDocument;
  try {
    dbDocument = await Media.create({ src: document.documentUrl, alt: name });
  } catch (error) {
    // DB write failed — remove the just-written file instead of orphaning it on disk
    await fs
      .unlink(path.join(process.cwd(), 'public', document.documentUrl))
      .catch(() => undefined);
    throw error;
  }

  return ApiResponse.success(res, {
    message: 'Document Upload Successfully',
    statusCode: 201,
    data: {
      id: dbDocument._id,
      fileName: document.fileName,
      url: document.documentUrl,
      size: document.size,
      mimetype: document.mimetype,
    },
  });
};
