import { Router } from "express";
import { inboxController, outboxController, sendMailController, sendMailToAllController } from "./mail.controller.js";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { sendMailSchema, sendMailToAllSchema } from "./mail.schema.js";

export const mailRouter = Router()

mailRouter.get("/",inboxController)
mailRouter.post("/send" ,authorize("write" , "mail") , validate(sendMailSchema), sendMailController)
mailRouter.post("/sendAll" , authorize("write","mail-all"), validate(sendMailToAllSchema),sendMailToAllController)
mailRouter.get("/outbox" , outboxController)