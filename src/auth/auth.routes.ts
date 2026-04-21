import { Router } from 'express';
import { LoginInputSchema } from './login/login.schema.js';
import { loginController } from './login/login.controller.js';
import { protectedRoute } from '../libs/middleware/protected-route.js';
import { logoutController } from './logout/logout.controller.js';
import { revalidateController } from './revalidate/revalidate.controller.js';
import { meController } from './me/me.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { verifyEmailController, verifyEmailRequestController } from './verfiy-email/controller.js';
import {
  changePasswordController,
  changePasswordRequestController,
} from './change-password/controller.js';
import { changeEmailController, changeEmailRequestController } from './change-email/controller.js';

const authRouter = Router();

authRouter.post('/login', validate(LoginInputSchema), loginController);
authRouter.post('/logout', protectedRoute, logoutController);
authRouter.post('/revalidate-token', protectedRoute, revalidateController);
authRouter.get('/me', protectedRoute, meController);

authRouter.route('/email-verify/request').post(protectedRoute, verifyEmailRequestController);
authRouter.route('/email-verify/confirm').post(verifyEmailController);

authRouter.route('/password-change/request').post(protectedRoute, changePasswordRequestController);
authRouter.route('/password-change/confirm').post(changePasswordController);

authRouter.route('/email-change/request').post(protectedRoute, changeEmailRequestController);
authRouter.route('/email-change/confirm').post(changeEmailController);

export default authRouter;
