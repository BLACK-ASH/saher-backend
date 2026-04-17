import { Router, Request, Response } from 'express';
import {
  createBankDetailController,
  deleteBankDetailController,
  getBankDetailController,
  updateBankDetailController,
} from './bank/bank.controller.js';
import { validateBankRegisterSchema, validateBankUpdateSchema } from './bank/bank.middleware.js';
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

adminRouter.get('/', (req: Request, res: Response) => {
  return res.status(200).json({ message: 'This Is A adminRouter Page' });
});

// Bank Routes
adminRouter
  .post(
    '/bank/register',
    authorize('write', 'bank'),
    validateBankRegisterSchema,
    createBankDetailController,
  )
  .get('/bank/get/:id', getBankDetailController)
  .put(
    '/bank/update/:id',
    authorize('update', 'bank'),
    validateBankUpdateSchema,
    updateBankDetailController,
  )
  .delete('/bank/delete/:id', authorize('delete', 'bank'), deleteBankDetailController);

// Account Routes
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
adminRouter
  .get('/user/get/:id', userGetController)
  .get('/user/get-all', getAllUser)
  .put('/user/update/:id', authorize('update', 'user'), validateUserUpdate, userUpdateController)
  .delete('/user/delete/:id', authorize('delete', 'user'), userDeleteController);

export default adminRouter;
