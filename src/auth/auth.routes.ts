import { Router, Request, Response } from "express";

import { createBankDetailController } from "./bank/bank.controller.js";
import { validateRegisterInput } from "./register/register.middleware.js";
import { validateBankRegisterSchema } from "./bank/bank.middleware.js";
import { validateLoginInput } from "./login/login.middleware.js";
import { loginController } from "./login/login.controller.js";
import { protectedRoute } from "../libs/middleware/protected-route.js";
import { logoutController } from "./logout/logout.controller.js";
import { revalidateController } from "./revalidate/revalidate.controller.js";
import { meController } from "./me/me.controller.js";

const authRouter = Router()

authRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is A Auth Page" })
})

authRouter.post("/login", validateLoginInput, loginController)
authRouter.post("/logout", protectedRoute, logoutController)
authRouter.post("/revalidate-token", protectedRoute, revalidateController)
authRouter.get("/me", protectedRoute, meController)

export default authRouter
