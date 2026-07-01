import { Router } from 'express';

import {
  addParticipantController,
  deleteParticipantController,
  editParticipantController,
  getAllParticipantController,
  getParticipantByIdController,
  undoDeleteParticipantController,
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
  undoDeleteProgramme,
} from './programmes/programmes.controller.js';
import {
  baseProgrammeSchema,
  createProgrammeSchema,
  updatedProgrammeSchema,
} from './programmes/programmes.schema.js';
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
  undoDeleteSession,
  getSessionByKeyword,
} from './session/session.controller.js';
import { createSessionSchema, updatedSessionSchema } from './session/session.schema.js';
import {
  addWorkshop,
  deleteWorkshop,
  editWorkshop,
  getSingleWorkshop,
  getWorkshopByKeyword,
  getWorkshopsFromProgramme,
  undoDeleteWorkshop,
  getWorkshops,
} from './workshop/workshop.controller.js';
import {
  baseWorkshopSchema,
  createWorkshopSchema,
  updatedWorkshopSchema,
} from './workshop/workshop.schema.js';
import { underDevelopment } from '../libs/middleware/development.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';
import { reminderNotificationController } from './session/reminder.controller.js';

const eventRouter = Router();

// Workshop route ---------------------------------------------------------------------
eventRouter.get(
  '/programmes/:programmeId/workshops',
  underDevelopment,
  authorize('read', 'event'),
  getWorkshops,
);

eventRouter.get(
  '/programmes/workshops/:workshopId',
  underDevelopment,
  authorize('read', 'event'),
  getSingleWorkshop,
);
/*eventRouter.get(
  '/workshops/search',
  underDevelopment,
  authorize('read', 'event'),
  getWorkshopByKeyword,
);

eventRouter.get(
  '/programmes/:programmeId/workshops',
  underDevelopment,
  authorize('read', 'event'),
  getWorkshopsFromProgramme,
);*/

eventRouter.post(
  '/programmes/:programmeId/workshops',
  underDevelopment,
  authorize('write', 'event'),
  validate(createWorkshopSchema),
  addWorkshop,
);
eventRouter.delete(
  '/programmes/:programmeId/workshops/:id',
  underDevelopment,
  authorize('delete', 'event'),
  deleteWorkshop,
);
/*
eventRouter.delete(
  '/programmes/:programmeId/workshops/:id/permanent',
  underDevelopment,
  authorize('delete', 'event'),

  permanentDeleteWorkshop,
);
*/

eventRouter.put(
  '/programs/:programmeId/workshops/:id',
  underDevelopment,
  authorize('update', 'event'),
  validate(updatedWorkshopSchema),
  editWorkshop,
);
eventRouter.patch(
  '/programs/:programmeId/workshops/:id/restore',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteWorkshop,
);

// Session route ----------------------------------------------------------------------
eventRouter.get(
  '/sessions/search',
  underDevelopment,
  authorize('read', 'event'),
  getSessionByKeyword,
);

eventRouter.get(
  '/programs/:programmeId/sessions',
  underDevelopment,
  authorize('read', 'event'),
  getSessions,
);
eventRouter.get(
  '/programs/sessions/:sessionId',
  underDevelopment,
  authorize('read', 'event'),
  getSingleSession,
);
eventRouter.post(
  '/programs/:programmeId/sessions',
  underDevelopment,
  authorize('write', 'event'),
  validate(createSessionSchema),
  addSession,
);
eventRouter.delete('/sessions/:id', underDevelopment, authorize('delete', 'event'), deleteSession);

/*eventRouter.delete(
  '/sessions/:id/permanent',
  underDevelopment,
  authorize('delete', 'event'),
  permanentDeleteSession,
);*/

eventRouter.put(
  '/sessions/:id',
  underDevelopment,
  authorize('update', 'event'),
  validate(updatedSessionSchema),
  editSession,
);
eventRouter.patch(
  '/sessions/:id/restore',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteSession,
);

// Particiapnt route ------------------------------------------------------------------------
eventRouter.get('/participants', underDevelopment, getAllParticipantController);
eventRouter.get('/participants/:id', underDevelopment, getParticipantByIdController);
eventRouter.post(
  '/participants',
  underDevelopment,
  authorize('write', 'event'),
  validate(participantSchema),
  addParticipantController,
);
eventRouter.delete(
  '/participants/:id',
  underDevelopment,
  authorize('delete', 'event'),
  deleteParticipantController,
);
/*
eventRouter.delete(
  '/participants/:id/permanent',
  underDevelopment,
  authorize('delete', 'event'),
  permanentDeleteParticipantController,
);*/

eventRouter.put(
  '/participants/:id',
  underDevelopment,
  authorize('update', 'event'),
  validate(updatedParticipantSchema),
  editParticipantController,
);
eventRouter.patch(
  '/participants/:id/restore',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteParticipantController,
);

// Session Attendance route ------------------------------------------------------------------------------
eventRouter.post(
  '/sessions/:sessionId/attendance',
  underDevelopment,
  authorize('write', 'event'),
  validate(SessionAttendanceSchema),
  markAttendance,
);
eventRouter.put(
  '/sessions/:sessionId/attendance',
  underDevelopment,
  authorize('update', 'event'),
  validate(SessionAttendanceSchema),
  updateAttendance,
);
eventRouter.delete(
  '/sessions/:sessionId/attendance',
  underDevelopment,
  authorize('delete', 'event'),
  validate(SessionAttendanceSchema),
  removeAttendance,
);

//Programme-Participant route ------------------------------------------------------------------------------
eventRouter.post(
  '/programs/:programmeId/participants',
  underDevelopment,
  authorize('write', 'event'),
  addParticipantToProgramme,
);

eventRouter.delete(
  '/programs/:programmeId/participants/:participantId',
  underDevelopment,
  authorize('delete', 'event'),
  removeParticipantFromProgramme,
);

//Programme routes ----------------------------------------------------------------------------------------------
eventRouter.get('/programs', underDevelopment, authorize('read', 'event'), getProgrammes);
eventRouter.get('/programs/:id', underDevelopment, authorize('read', 'event'), getSingleProgramme);
eventRouter.post(
  '/programs',
  underDevelopment,
  authorize('write', 'event'),
  validate(createProgrammeSchema),
  addProgramme,
);
eventRouter.delete(
  '/programs/:id',
  underDevelopment,
  authorize('delete', 'event'),
  deleteProgramme,
);
/*
eventRouter.delete(
  '/programmes/:id/permanent',
  underDevelopment,
  authorize('delete', 'event'),
  permanentDeleteProgramme,
);*/
eventRouter.put(
  '/programs/:id',
  underDevelopment,
  authorize('update', 'event'),
  validate(updatedProgrammeSchema),
  editProgramme,
);
eventRouter.patch(
  '/programs/:id/restore',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteProgramme,
);

// Reminder session notification
eventRouter.get(
  '/programs/workshops/sessions/:sessionId',
  authorize('read', 'event'),
  reminderNotificationController,
);
export default eventRouter;
