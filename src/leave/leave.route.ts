import { Router } from "express";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { leaveSchema } from "./leave.schema.js";
import { applyLeaveController } from "./leave.controller.js";

const leaveRouter = Router()

leaveRouter.post("/apply",validate(leaveSchema),applyLeaveController)

export default leaveRouter

