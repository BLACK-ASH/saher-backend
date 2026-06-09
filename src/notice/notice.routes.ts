import { Router, Request, Response } from 'express';

import { addNotice, editNotice, permanentDeleteNotice } from './notice.controller.js';
import { baseNoticeSchema, updateNoticeSchema } from './notice.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

//Router declaration
const noticeRouter = Router();

//Notice Routes ---------------------------------------------------------------
noticeRouter.post('/notice', validate(baseNoticeSchema), addNotice);
noticeRouter.put('/notice/:id', validate(updateNoticeSchema), editNotice);
noticeRouter.delete('/notice/:id/permanent', permanentDeleteNotice);

//Router exporting
export default noticeRouter;
