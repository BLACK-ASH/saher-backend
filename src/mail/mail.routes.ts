import { Router } from "express";
import { inboxController, sendMailController } from "./mail.controller.js";

export const mailRouter = Router()

mailRouter.get("/",inboxController)
mailRouter.post("/send" , sendMailController)