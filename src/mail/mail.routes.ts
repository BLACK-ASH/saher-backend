import { Router } from "express";
import { inboxController, outboxController, sendMailController } from "./mail.controller.js";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { sendMailSchema } from "./mail.schema.js";

export const mailRouter = Router()

mailRouter.get("/",inboxController)
mailRouter.post("/send" ,authorize("write" , "mail") , validate(sendMailSchema), sendMailController)
mailRouter.get("/outbox" , outboxController)