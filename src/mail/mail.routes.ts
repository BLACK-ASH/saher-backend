import { Router } from "express";
import { inboxController, outboxController, sendMailController, sendMailToAllController } from "./mail.controller.js";
import { authorize } from "../permission/authorize.js";

export const mailRouter = Router()

mailRouter.get("/",inboxController)
mailRouter.post("/send" ,authorize("write" , "mail") , sendMailController)
mailRouter.post("/sendAll" , authorize("write","mail-all"),sendMailToAllController)
mailRouter.get("/outbox" , outboxController)