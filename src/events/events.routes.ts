import { Router, Request, Response } from "express";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { addSession, deleteSession, editSession, } from "./session/session.controller.js";
import { addWorkshop, deleteWorkshop, editWorkshop, } from "./workshop/workshop.controller.js";
import { addParticipant, deleteParticipant, editParticipant, readAllParticipant } from "./participant/participant.controller.js";
import { markAttendance, } from "./session/sessionAttendance.controller.js";
import { createWorkshopSchema, updatedWorkshopSchema, } from "./workshop/workshop.schema.js";
import { createSessionSchema, updatedSessionSchema, } from "./session/session.schema.js";
import { participantSchema, updatedParticipantSchema } from "./participant/participant.schema.js";
import { SessionAttendanceSchema } from "./session/sessionAttendance.schema.js";
import { updateAttendance } from "./session/session-update-attendance.controller.js";


const eventRouter = Router();

// Workshop route ---------------------------------------------------------------------
eventRouter.post("/workshops", validate(createWorkshopSchema), addWorkshop);
eventRouter.get("/workshops", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This is a Workshop Router Page" });
});
eventRouter.delete("/workshops/:id", deleteWorkshop);
eventRouter.put("/workshops/:id", validate(updatedWorkshopSchema), editWorkshop,);

// Session route ----------------------------------------------------------------------
eventRouter.post("/:workshopId/sessions", validate(createSessionSchema), addSession);
eventRouter.get("/sessions", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This is a Session Router Page" });
});
eventRouter.delete("/sessions/:id", deleteSession);
eventRouter.put("/sessions/:id", validate(updatedSessionSchema), editSession);

// Particiapnt route ------------------------------------------------------------------------
eventRouter.post("/participants", validate(participantSchema), addParticipant);
eventRouter.get("/workshops/:workshopId/participants", readAllParticipant);
eventRouter.delete("/participants/:id", deleteParticipant);
eventRouter.put("/participants/:id", validate(updatedParticipantSchema), editParticipant,);

// Session Attendance route ------------------------------------------------------------------------------
eventRouter.post("/sessions/:sessionId/attendance", validate(SessionAttendanceSchema), markAttendance);
eventRouter.put("/sessions/:sessionId/attendance", validate(SessionAttendanceSchema), updateAttendance);


export default eventRouter;
