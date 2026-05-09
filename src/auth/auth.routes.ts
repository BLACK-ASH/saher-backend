import { Router } from 'express';

import { changeEmailController, changeEmailRequestController } from './change-email/controller.js';
import {
  changePasswordController,
  changePasswordRequestController,
} from './change-password/controller.js';
import {
  forgotPasswordController,
  forgotPasswordRequestController,
} from './forgot-password/controller.js';
import { loginController } from './login/login.controller.js';
import { LoginInputSchema } from './login/login.schema.js';
import { logoutController } from './logout/logout.controller.js';
import { meController } from './me/me.controller.js';
import { revalidateController } from './revalidate/revalidate.controller.js';
import { verifyEmailController, verifyEmailRequestController } from './verfiy-email/controller.js';
import { protectedRoute } from '../libs/middleware/protected-route.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

const authRouter = Router();

authRouter.post('/login', validate(LoginInputSchema), loginController);
authRouter.post('/logout', protectedRoute, logoutController);
authRouter.post('/revalidate-token', protectedRoute, revalidateController);
authRouter.get('/me', protectedRoute, meController);

authRouter.route('/verify-email/request').post(protectedRoute, verifyEmailRequestController);
authRouter.route('/verify-email/confirm').post(verifyEmailController);

authRouter.route('/change-password/request').post(protectedRoute, changePasswordRequestController);
authRouter.route('/change-password/confirm').post(changePasswordController);

authRouter.route('/forgot-password/request').post(forgotPasswordRequestController);
authRouter.route('/forgot-password/confirm').post(forgotPasswordController);

authRouter.route('/change-email/request').post(protectedRoute, changeEmailRequestController);
authRouter.route('/change-email/confirm').post(changeEmailController);

export default authRouter;
