import { Router } from 'express';

import {
  addParticipant,
  deleteParticipant,
  editParticipant,
} from './participant/participant.controller.js';
import { participantSchema, updatedParticipantSchema } from './participant/participant.schema.js';
import { getProgrammes, getSingleProgramme ,
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
import { underDevelopment } from '../libs/middleware/development.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

const eventRouter = Router();

// Workshop route ---------------------------------------------------------------------
eventRouter.post(
  '/programmes/:programmeId/workshops',
  underDevelopment,
  validate(createWorkshopSchema),
  addWorkshop,
);
eventRouter.delete('/programmes/:programmeId/workshops/:id', underDevelopment, deleteWorkshop);
eventRouter.delete(
  '/programmes/:programmeId/workshops/:id/permanent',
  underDevelopment,
  permanentDeleteWorkshop,
);
eventRouter.put(
  '/programmes/:programmeId/workshops/:id',
  underDevelopment,
  validate(updatedWorkshopSchema),
  editWorkshop,
);
eventRouter.patch(
  '/programmes/:programmeId/workshops/:id/restore',
  underDevelopment,
  undoDeleteWorkshop,
);

// Session route ----------------------------------------------------------------------
eventRouter.post(
  '/workshops/:workshopId/sessions',
  underDevelopment,
  validate(createSessionSchema),
  addSession,
);
eventRouter.delete('/sessions/:id', underDevelopment, deleteSession);
eventRouter.delete('/sessions/:id/permanent', underDevelopment, permanentDeleteSession);
eventRouter.put('/sessions/:id', underDevelopment, validate(updatedSessionSchema), editSession);
eventRouter.patch('/sessions/:id/restore', underDevelopment, undoDeleteSession);

// Particiapnt route ------------------------------------------------------------------------
eventRouter.post('/participants', underDevelopment, validate(participantSchema), addParticipant);
eventRouter.delete('/participants/:id', underDevelopment, deleteParticipant);
eventRouter.put(
  '/participants/:id',
  underDevelopment,
  validate(updatedParticipantSchema),
  editParticipant,
);

// Session Attendance route ------------------------------------------------------------------------------
eventRouter.post(
  '/sessions/:sessionId/attendance',
  underDevelopment,
  validate(SessionAttendanceSchema),
  markAttendance,
);
eventRouter.put(
  '/sessions/:sessionId/attendance',
  underDevelopment,
  validate(SessionAttendanceSchema),
  updateAttendance,
);
eventRouter.delete(
  '/sessions/:sessionId/attendance',
  underDevelopment,
  validate(SessionAttendanceSchema),
  removeAttendance,
);

//Workshop-Participant route ------------------------------------------------------------------------------
eventRouter.post('/workshops/:workshopId/participants', underDevelopment, addParticipantToWorkshop);
eventRouter.delete(
  '/workshops/:workshopId/participants/:participantId',
  underDevelopment,
  removeParticipantFromWorkshop,
);

//Programme routes ----------------------------------------------------------------------------------------------
eventRouter.get('/programmes', underDevelopment, getProgrammes);
eventRouter.get('/programmes/:id', underDevelopment, getSingleProgramme);
eventRouter.post('/programmes', underDevelopment, validate(baseProgrammeSchema), addProgramme);
eventRouter.delete('/programmes/:id', underDevelopment, deleteProgramme);
eventRouter.delete('/programmes/:id/permanent', underDevelopment, permanentDeleteProgramme);
eventRouter.put(
  '/programmes/:id',
  underDevelopment,
  validate(updatedProgrammeSchema),
  editProgramme,
);
eventRouter.patch('/programmes/:id/restore', underDevelopment, undoDeleteProgramme);
export default eventRouter;
