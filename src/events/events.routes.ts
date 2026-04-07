import { Router, Request, Response } from "express";
import {
  addSession,
  deleteSession,
  editSession,
} from "./session/event.controller.js";
import {
  addWorkshop,
  deleteWorkshop,
  editWorkshop,
} from "./workshop/workshop.controller.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import {
  createWorkshopSchema,
  updatedWorkshopSchema,
} from "./workshop/workshop.schema.js";
import { createSessionSchema, updatedSessionSchema } from "./session/session.schema.js";

const eventRouter = Router();

// Session route
eventRouter.post("/session", validate(createSessionSchema), addSession);
eventRouter.get("/session", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This is a Session Router Page" });
});
eventRouter.delete("/session/:id", deleteSession);
eventRouter.patch("/session/:id", validate(updatedSessionSchema), editSession);

// Workshop route
eventRouter.post("/workshop", validate(createWorkshopSchema), addWorkshop);
eventRouter.get("/workshop", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This is a Workshop Router Page" });
});
eventRouter.delete("/workshop/:id", deleteWorkshop);
eventRouter.patch(
  "/workshop/:id",
  validate(updatedWorkshopSchema),
  editWorkshop,
);
export default eventRouter;
