import { Router } from 'express';

import {
  addParticipant,
  deleteParticipant,
  editParticipant,
  readAllParticipant,
} from './participant/participant.controller.js';
import { participantSchema, updatedParticipantSchema } from './participant/participant.schema.js';
import {
  addParticipantToProgramme,
  removeParticipantFromProgramme,
} from './programmes/programme-participant.controller.js';
import {
  getProgrammes,
  getSingleProgramme,
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
  getSessions,
  getSingleSession,
  permanentDeleteSession,
  undoDeleteSession,
} from './session/session.controller.js';
import { createSessionSchema, updatedSessionSchema } from './session/session.schema.js';
import {
  addWorkshop,
  deleteWorkshop,
  editWorkshop,
  getSingleWorkshop,
  getWorkshops,
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
eventRouter.get('/programmes/:programmeId/workshops', underDevelopment, getWorkshops);
eventRouter.get(
  '/programmes/:programmeId/workshops/:workshopId',
  underDevelopment,
  getSingleWorkshop,
);
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
eventRouter.get('/workshops/:workshopId/sessions', underDevelopment, getSessions);
eventRouter.get('/workshops/:workshopId/sessions/:sessionId', underDevelopment, getSingleSession);
eventRouter.post(
  '/programmes/:programmeId/sessions',
  underDevelopment,
  validate(createSessionSchema),
  addSession,
);
eventRouter.delete('/sessions/:id', underDevelopment, deleteSession);
eventRouter.delete('/sessions/:id/permanent', underDevelopment, permanentDeleteSession);
eventRouter.put('/sessions/:id', underDevelopment, validate(updatedSessionSchema), editSession);
eventRouter.patch('/sessions/:id/restore', underDevelopment, undoDeleteSession);

// Particiapnt route ------------------------------------------------------------------------
eventRouter.get('/participants', underDevelopment, readAllParticipant);
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
eventRouter.post(
  '/programmes/:programmeId/participants',
  underDevelopment,
  addParticipantToProgramme,
);

eventRouter.delete(
  '/programmes/:programmeId/participants/:participantId',
  underDevelopment,
  removeParticipantFromProgramme,
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
