import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  uploadBulkDocumentsController,
  uploadDocumentController,
} from './document/document.controller.js';
import { uploadDocument } from './document/document.middleware.js';
import { uploadImageController } from './image/image.controller.js';
import { uploadImage } from './image/image.middleware.js';

const uploadRouter = Router();

uploadRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json('This Is A Upload Route');
});

uploadRouter.post('/image', uploadImage.single('image'), uploadImageController);

uploadRouter.post('/document', uploadDocument.single('document'), uploadDocumentController);

uploadRouter.post('/documents', uploadDocument.array('documents', 10), uploadBulkDocumentsController);

export default uploadRouter;
