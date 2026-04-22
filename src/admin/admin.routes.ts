import { Router } from 'express';
import {
  createBankDetailController,
  deleteBankDetailController,
  getBankDetailController,
  updateBankDetailController,
} from './bank/controller.js';
import { bankSchema, bankUpdateSchema } from './bank/schema.js';
import { accountRegisterSchema, accountUpdateSchema } from './account/schema.js';
import {
  accountGetByUserController,
  accountGetController,
  accountRegisterController,
  accountUpdateController,
} from './account/controller.js';
import {
  getAllUser,
  userDeleteController,
  userGetController,
  userUpdateController,
} from './user/controller.js';
import { userUpdateSchema } from './user/schema.js';
import { authorize } from '../permission/authorize.js';
import { validate, validateAsync } from '../libs/middleware/validate-zod-schema.js';

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
// NOTE:Change Routes
adminRouter.post(
  '/account',
  authorize('write', 'account'),
  validateAsync(accountRegisterSchema),
  accountRegisterController,
);

adminRouter.get('/account/user/', accountGetByUserController);

adminRouter
  .route('/account/:id')
  .put(authorize('update', 'account'), validate(accountUpdateSchema), accountUpdateController)
  .get(accountGetController);

// User Routes
// NOTE:Change Routes
adminRouter.get('/users', getAllUser);
adminRouter
  .route('/user/:id')
  .get(userGetController)
  .put(authorize('update', 'user'), validate(userUpdateSchema), userUpdateController)
  .delete(authorize('delete', 'user'), userDeleteController);

export default adminRouter;
