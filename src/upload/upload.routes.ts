import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  uploadBulkDocumentsController,
  uploadDocumentController,
} from './document/document.controller.js';
import { uploadDocument } from './document/document.middleware.js';
import {
  uploadBulkImagesController,
  uploadImageController,
} from './image/image.controller.js';
import { uploadImage } from './image/image.middleware.js';

const uploadRouter = Router();

uploadRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json('This Is A Upload Route');
});

uploadRouter.post('/image', uploadImage.single('image'), uploadImageController);

// multer count cap: business limits live in domain schemas (e.g. bills max 10);
// bulk image/document uploads themselves are unbounded to match nginx client_max_body_size
uploadRouter.post('/images', uploadImage.array('images', 50), uploadBulkImagesController);

uploadRouter.post('/document', uploadDocument.single('document'), uploadDocumentController);

uploadRouter.post(
  '/documents',
  uploadDocument.array('documents', 50),
  uploadBulkDocumentsController,
);

export default uploadRouter;
