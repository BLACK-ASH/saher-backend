import { Router } from 'express';
import {
  createBankDetailController,
  deleteBankDetailController,
  getBankDetailController,
  updateBankDetailController,
} from './bank/controller.js';
import { bankDetailSchema, bankUpdateSchema } from './bank/schema.js';
import { accountRegisterSchema, accountUpdateSchema } from './account/schema.js';
import {
  accountGetController,
  accountRegisterController,
  accountUpdateController,
} from './account/controller.js';
import {
  getAllUserController,
  userDeleteController,
  adminUserGetController,
  adminUserUpdateController,
} from './user/controller.js';
import { adminUserUpdateSchema } from './user/schema.js';
import { authorize } from '../permission/authorize.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

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
  validate(bankDetailSchema),
  createBankDetailController,
);

// Account Routes
// NOTE:Change Routes
adminRouter
  .post(
    '/account/register',
    authorize('write', 'account'),
    validate(accountRegisterSchema),
    accountRegisterController,
  )
  .put(
    '/account/update/:id',
    authorize('update', 'account'),
    validate(accountUpdateSchema),
    accountUpdateController,
  )
  .get('/account/get/:id', accountGetController);

// User Routes
// NOTE:Change Routes
adminRouter.get('/users', getAllUserController);
adminRouter
  .route('/user/:id')
  .get(adminUserGetController)
  .put(authorize('update', 'user'), validate(adminUserUpdateSchema), adminUserUpdateController)
  .delete(authorize('delete', 'user'), userDeleteController);

export default adminRouter;
