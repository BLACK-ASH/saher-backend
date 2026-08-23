import { Router } from 'express';

import {
  accountGetController,
  accountRegisterController,
  accountUpdateController,
} from './account/controller.js';
import { accountRegisterSchema, accountUpdateSchema } from './account/schema.js';
import {
  createBankDetailController,
  deleteBankDetailController,
  getBankDetailController,
  updateBankDetailController,
} from './bank/controller.js';
import { bankSchema, bankUpdateSchema } from './bank/schema.js';
import {
  getAllUsersController,
  userDeleteController,
  userGetController,
  userRestoreController,
  userUpdateController,
} from './user/controller.js';
import { userUpdateSchema } from './user/schema.js';
import { validate, validateAsync } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

const adminRouter = Router();

// Bank Routes
// For Common endpoint using express route
adminRouter
  .route('/bank/:id')
  .get(getBankDetailController)
  .put(authorize('update', 'bank'), validate(bankUpdateSchema), updateBankDetailController)
  .delete(authorize('delete', 'bank'), deleteBankDetailController);

adminRouter.post(
  '/bank',
  authorize('write', 'bank'),
  validate(bankSchema),
  createBankDetailController,
);

// Account Routes
adminRouter.post(
  '/account',
  authorize('write', 'account'),
  validateAsync(accountRegisterSchema),
  accountRegisterController,
);

adminRouter
  .route('/account/:id')
  .put(authorize('update', 'account'), validate(accountUpdateSchema), accountUpdateController)
  .get(accountGetController);

// User Routes
adminRouter.get('/users', authorize('read', 'user'), getAllUsersController);

adminRouter
  .route('/user/:id')
  .get(userGetController)
  .put(authorize('update', 'user'), validateAsync(userUpdateSchema), userUpdateController)
  .delete(authorize('delete', 'user'), userDeleteController);
adminRouter.patch(
  '/user/:id/restore',
  authorize('update', 'user'),
  userRestoreController,
);

export default adminRouter;
