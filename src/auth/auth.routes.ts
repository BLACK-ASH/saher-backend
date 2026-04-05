import { Router, Request, Response } from "express";
import { LoginInputSchema } from "./login/login.schema.js";
import { loginController } from "./login/login.controller.js";
import { protectedRoute } from "../libs/middleware/protected-route.js";
import { logoutController } from "./logout/logout.controller.js";
import { revalidateController } from "./revalidate/revalidate.controller.js";
import { meController } from "./me/me.controller.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";

const authRouter = Router()

authRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is A Auth Page" })
})

authRouter.post("/login", validate(LoginInputSchema), loginController)
authRouter.post("/logout", protectedRoute, logoutController)
authRouter.post("/revalidate-token", protectedRoute, revalidateController)
authRouter.get("/me", protectedRoute, meController)

export default authRouter
