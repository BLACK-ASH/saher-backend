import { Router, Request, Response } from "express";
import { validateLoginInput } from "./login/login.middleware.js";
import { loginController } from "./login/login.controller.js";

const authRouter = Router()

authRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is A Auth Page" })
})

authRouter.post("/login", validateLoginInput, loginController)

export default authRouter
