import { Router, Request, Response } from 'express';
import {
  createBankDetailController,
  deleteBankDetailController,
  getBankDetailController,
  updateBankDetailController,
} from './bank/bank.controller.js';
import { validateBankRegisterSchema, validateBankUpdateSchema } from './bank/bank.middleware.js';
import { validateAccountRegister, validateAccountUpdate } from './account/account.middleware.js';
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
    validateAccountRegister,
    accountRegisterController,
  )
  .put(
    '/account/update/:id',
    authorize('update', 'account'),
    validateAccountUpdate,
    accountUpdateController,
  )
  .get('/account/get/:id', accountGetController);

// User Routes
adminRouter
  .get('/user/get/:id', userGetController)
  .get('/user/get-all', getAllUser)
  .put('/user/update/:id', authorize('update', 'user'), validateUserUpdate, userUpdateController)
  .delete('/user/delete/:id', authorize('delete', 'user'), userDeleteController);

<<<<<<< HEAD
<<<<<<< HEAD
export default adminRouter
=======
export default adminRouter;
>>>>>>> d72bcf44c4b8e201915ebe08181aea1ace4c2a52
=======
export default adminRouter;
>>>>>>> 88fef16bd2423037858c8d87e009abab481f82f3
