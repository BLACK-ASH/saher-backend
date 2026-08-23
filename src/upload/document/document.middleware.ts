import type { Request } from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();

const supportedFileMimeType = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const fileFilter: multer.Options['fileFilter'] = (req: Request, file, cb) => {
  // To Check The Given Document Type Is Supported
  if (!supportedFileMimeType.has(file.mimetype)) {
    req.fileValidationError = 'Only PDF, DOC, PPT, XLS Files Are Allowed';
    return cb(null, false);
  }

  cb(null, true);
};

export const uploadDocument = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
