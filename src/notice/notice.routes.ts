import { Router } from 'express';

import { addNotice, deleteNotice, editNotice, getNotices, permanentDeleteNotice, restoreNotice } from './notice.controller.js';
import { createNoticeSchema, updateNoticeSchema } from './notice.schema.js';
import { underDevelopment } from '../libs/middleware/development.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

//Router declaration --------
const noticeRouter = Router();

//Notice Routes ---------------------------------------------------------------
noticeRouter.post('/notice', underDevelopment, validate(createNoticeSchema), addNotice);
noticeRouter.get('/notice', underDevelopment, getNotices);
noticeRouter.put('/notice/:id', underDevelopment, validate(updateNoticeSchema), editNotice);
noticeRouter.delete('/notice/:id', underDevelopment, deleteNotice);
noticeRouter.patch('/notice/:id/restore', underDevelopment, restoreNotice);
noticeRouter.delete('/notice/:id/permanent', underDevelopment, permanentDeleteNotice);

//Router exporting --------
export default noticeRouter;
