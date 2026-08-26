import { Router } from 'express';

import { addNotice, deleteNotice, editNotice, getNotices, permanentDeleteNotice, restoreNotice } from './notice.controller.js';
import { createNoticeSchema, updateNoticeSchema } from './notice.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

//Router declaration --------
const noticeRouter = Router();

//Notice Routes ---------------------------------------------------------------
// Mounted at /api/notice in app.ts — paths here must NOT repeat the prefix.
// GET stays login-only (protectedRoute at mount): the board is org-wide broadcast
// and most roles hold no notice:read by design.
noticeRouter.post('/', authorize('write', 'notice'), validate(createNoticeSchema), addNotice);
noticeRouter.get('/', getNotices);
noticeRouter.put('/:id', authorize('update', 'notice'), validate(updateNoticeSchema), editNotice);
noticeRouter.delete('/:id', authorize('delete', 'notice'), deleteNotice);
noticeRouter.patch('/:id/restore', authorize('update', 'notice'), restoreNotice);
noticeRouter.delete('/:id/permanent', authorize('delete', 'notice'), permanentDeleteNotice);

//Router exporting --------
export default noticeRouter;
