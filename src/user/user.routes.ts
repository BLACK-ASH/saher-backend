import { Router } from 'express';

import {
  updateUserController,
  userGetController,
  userSearchController,
} from './user.controller.js';
import { userUpdateSchema } from './user.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

const userRouter = Router();

userRouter.route('/').get(userGetController).put(validate(userUpdateSchema), updateUserController);

userRouter.get('/:keyword', userSearchController);

export default userRouter;
