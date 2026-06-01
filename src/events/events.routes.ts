import { Router, Request, Response } from 'express';

import {
  addParticipant,
  deleteParticipant,
  editParticipant,
} from './participant/participant.controller.js';
import { participantSchema, updatedParticipantSchema } from './participant/participant.schema.js';
import { baseProgrammeSchema, updatedProgrammeSchema } from './programmes/programmes.schema.js';
import { markAttendance } from './session/session-attendance.controller.js';
import { SessionAttendanceSchema } from './session/session-attendance.schema.js';
import { removeAttendance } from './session/session-remove-attendance.controller.js';
import { updateAttendance } from './session/session-update-attendance.controller.js';
import { addSession, deleteSession, editSession } from './session/session.controller.js';
import { createSessionSchema, updatedSessionSchema } from './session/session.schema.js';
import {
  addParticipantToWorkshop,
  removeParticipantFromWorkshop,
} from './workshop/workshop-participant.controller.js';
import { addWorkshop, deleteWorkshop, editWorkshop } from './workshop/workshop.controller.js';
import {
  baseWorkshopSchema,
  createWorkshopSchema,
  updatedWorkshopSchema,
} from './workshop/workshop.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

const eventRouter = Router();

// Workshop route ---------------------------------------------------------------------
eventRouter.post('/workshops', validate(createWorkshopSchema), addWorkshop);
eventRouter.delete('/workshops/:id', deleteWorkshop);
eventRouter.put('/workshops/:id', validate(updatedWorkshopSchema), editWorkshop);

// Session route ----------------------------------------------------------------------
eventRouter.post('/:workshopId/sessions', validate(createSessionSchema), addSession);
eventRouter.delete('/sessions/:id', deleteSession);
eventRouter.put('/sessions/:id', validate(updatedSessionSchema), editSession);

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
eventRouter.post(
  '/programmes/:programmeId/workshops/:workshopId',
  validate(baseProgrammeSchema),
  addWorkshop,
);
eventRouter.delete('/programmes/:programmeId/workshops/:workshopId', deleteWorkshop);
eventRouter.put(
  '/programmes/:programmeId/workshops/:workshopId',
  validate(updatedProgrammeSchema),
  editWorkshop,
);

export default eventRouter;
