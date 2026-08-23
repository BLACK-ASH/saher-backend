import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { logger } from '../../libs/logger/logger.js';

const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'documents');

export const saveDocument = async (file: Express.Multer.File) => {
  const fileName = `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
  const filePath = path.join(uploadPath, fileName);
  const documentUrl = `/uploads/documents/${fileName}`;

  try {
    // Ensure Directory Exists
    await fs.mkdir(uploadPath, { recursive: true });

    await fs.writeFile(filePath, file.buffer);

    return {
      fileName,
      documentUrl,
      size: file.buffer.length,
      mimetype: file.mimetype,
    };
  } catch (error) {
    logger.error({ err: error }, 'Document Upload Failed');
    throw error;
  }
};
