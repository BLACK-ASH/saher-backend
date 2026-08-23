import { Router } from 'express';

import { getInboxController, outboxController, sendMailController } from './mail.controller.js';
import { mailListQuerySchema, sendMailSchema } from './mail.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

export const mailRouter = Router();

mailRouter.get('/', validate(mailListQuerySchema, 'query'), getInboxController);
mailRouter.post('/', authorize('write', 'mail'), validate(sendMailSchema), sendMailController);
mailRouter.get('/outbox', validate(mailListQuerySchema, 'query'), outboxController);
