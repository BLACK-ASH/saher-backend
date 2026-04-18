import { Router } from 'express';
import {
  createBankDetailController,
  deleteBankDetailController,
  getBankDetailController,
  updateBankDetailController,
} from './bank/bank.controller.js';
import { bankDetailSchema, bankUpdateSchema } from './bank/bank.middleware.js';
import { accountRegisterSchema, accountUpdateSchema } from './account/account.schema.js';
import {
  accountGetController,
  accountRegisterController,
  accountUpdateController,
} from './account/account.controller.js';
import {
  getAllUser,
  userDeleteController,
  userGetController,
  userUpdateController,
} from './user/user.controller.js';
import { validateUserUpdate } from './user/user.middleware.js';
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
adminRouter
  .get('/user/get/:id', userGetController)
  .get('/user/get-all', getAllUser)
  .put('/user/update/:id', authorize('update', 'user'), validateUserUpdate, userUpdateController)
  .delete('/user/delete/:id', authorize('delete', 'user'), userDeleteController);

export default adminRouter;
