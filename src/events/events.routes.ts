import { Router, Request, Response } from 'express';

import {
  addParticipant,
  deleteParticipant,
  editParticipant,
} from './participant/participant.controller.js';
import { participantSchema, updatedParticipantSchema } from './participant/participant.schema.js';
import {
  addProgramme,
  editProgramme,
  deleteProgramme,
  permanentDeleteProgramme,
  undoDeleteProgramme,
} from './programmes/programmes.controller.js';
import { baseProgrammeSchema, updatedProgrammeSchema } from './programmes/programmes.schema.js';
import { markAttendance } from './session/session-attendance.controller.js';
import { SessionAttendanceSchema } from './session/session-attendance.schema.js';
import { removeAttendance } from './session/session-remove-attendance.controller.js';
import { updateAttendance } from './session/session-update-attendance.controller.js';
import {
  addSession,
  deleteSession,
  editSession,
  permanentDeleteSession,
  undoDeleteSession,
} from './session/session.controller.js';
import { createSessionSchema, updatedSessionSchema } from './session/session.schema.js';
import {
  addParticipantToWorkshop,
  removeParticipantFromWorkshop,
} from './workshop/workshop-participant.controller.js';
import {
  addWorkshop,
  deleteWorkshop,
  editWorkshop,
  permanentDeleteWorkshop,
  undoDeleteWorkshop,
} from './workshop/workshop.controller.js';
import {
  baseWorkshopSchema,
  createWorkshopSchema,
  updatedWorkshopSchema,
} from './workshop/workshop.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

const eventRouter = Router();

// Workshop route ---------------------------------------------------------------------
eventRouter.post('/programmes/:programmeId/workshops', validate(createWorkshopSchema), addWorkshop);
eventRouter.delete('/programmes/:programmeId/workshops/:id', deleteWorkshop);
eventRouter.delete('/programmes/:programmeId/workshops/:id/permanent', permanentDeleteWorkshop);
eventRouter.put(
  '/programmes/:programmeId/workshops/:id',
  validate(updatedWorkshopSchema),
  editWorkshop,
);
eventRouter.patch('/programmes/:programmeId/workshops/:id/restore', undoDeleteWorkshop);

// Session route ----------------------------------------------------------------------
eventRouter.post('/workshops/:workshopId/sessions', validate(createSessionSchema), addSession);
eventRouter.delete('/sessions/:id', deleteSession);
eventRouter.delete('/sessions/:id/permanent', permanentDeleteSession);
eventRouter.put('/sessions/:id', validate(updatedSessionSchema), editSession);
eventRouter.patch('/sessions/:id/restore', undoDeleteSession);

// Particiapnt route ------------------------------------------------------------------------
eventRouter.post('/participants', validate(participantSchema), addParticipant);
eventRouter.delete('/participants/:id', deleteParticipant);
eventRouter.put('/participants/:id', validate(updatedParticipantSchema), editParticipant);

// Session Attendance route ------------------------------------------------------------------------------
eventRouter.post(
  '/sessions/:sessionId/attendance',
  validate(SessionAttendanceSchema),
  markAttendance,
);
eventRouter.put(
  '/sessions/:sessionId/attendance',
  validate(SessionAttendanceSchema),
  updateAttendance,
);
eventRouter.delete(
  '/sessions/:sessionId/attendance',
  validate(SessionAttendanceSchema),
  removeAttendance,
);

//Workshop-Participant route ------------------------------------------------------------------------------
eventRouter.post('/workshops/:workshopId/participants', addParticipantToWorkshop);
eventRouter.delete(
  '/workshops/:workshopId/participants/:participantId',
  removeParticipantFromWorkshop,
);

//Programme routes ----------------------------------------------------------------------------------------------
eventRouter.post('/programmes', validate(baseProgrammeSchema), addProgramme);
eventRouter.delete('/programmes/:id', deleteProgramme);
eventRouter.delete('/programmes/:id/permanent', permanentDeleteProgramme);
eventRouter.put('/programmes/:id', validate(updatedProgrammeSchema), editProgramme);
eventRouter.patch('/programmes/:id/restore', undoDeleteProgramme);
export default eventRouter;
