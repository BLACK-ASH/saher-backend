import { Router } from 'express';

import {
  addParticipantController,
  deleteParticipantController,
  editParticipantController,
  getParticipants,
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
import { createProgrammeSchema, updatedProgrammeSchema } from './programmes/programmes.schema.js';
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
} from './session/session.controller.js';
import { createSessionSchema, updatedSessionSchema } from './session/session.schema.js';
import {
  addWorkshop,
  deleteWorkshop,
  getSingleWorkshop,
  editWorkshop,
  undoDeleteWorkshop,
  getWorkshops,
} from './workshop/workshop.controller.js';
import { createWorkshopSchema, updatedWorkshopSchema } from './workshop/workshop.schema.js';
import { underDevelopment } from '../libs/middleware/development.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';
import { reminderNotificationController } from './session/reminder.controller.js';

const eventRouter = Router();

// Workshop route ---------------------------------------------------------------------
eventRouter.get('/workshops', underDevelopment, authorize('read', 'event'), getWorkshops);

eventRouter.get(
  '/workshops/:workshopId',
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
  '/workshops/:programmeId',
  underDevelopment,
  authorize('write', 'event'),
  validate(createWorkshopSchema),
  addWorkshop,
);
eventRouter.delete(
  '/workshops/:programmeId',
  underDevelopment,
  authorize('delete', 'event'),
  deleteWorkshop,
);

eventRouter.put(
  '/workshops/:id',
  underDevelopment,
  authorize('update', 'event'),
  validate(updatedWorkshopSchema),
  editWorkshop,
);
eventRouter.patch(
  '/workshops/restore/:id',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteWorkshop,
);

// Session route ----------------------------------------------------------------------
eventRouter.get('/sessions', underDevelopment, authorize('read', 'event'), getSessions);

/*
eventRouter.get(
  '/sessions/:programmeId',
  underDevelopment,
  authorize('read', 'event'),
  getSessions,
);*/

eventRouter.get(
  '/sessions/:sessionId',
  underDevelopment,
  authorize('read', 'event'),
  getSingleSession,
);

eventRouter.post(
  '/sessions/:programmeId',
  underDevelopment,
  authorize('write', 'event'),
  validate(createSessionSchema),
  addSession,
);
eventRouter.delete('/sessions/:id', underDevelopment, authorize('delete', 'event'), deleteSession);

eventRouter.put(
  '/sessions/:id',
  underDevelopment,
  authorize('update', 'event'),
  validate(updatedSessionSchema),
  editSession,
);

eventRouter.patch(
  '/sessions/restore/:id',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteSession,
);

// Particiapnt route ------------------------------------------------------------------------
eventRouter.get('/participants', underDevelopment, getParticipants);
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
  '/participants/restore/:id',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteParticipantController,
);

// Session Attendance route ------------------------------------------------------------------------------
eventRouter.post(
  '/attendance/sessions/:sessionId',
  underDevelopment,
  authorize('write', 'event'),
  validate(SessionAttendanceSchema),
  markAttendance,
);
eventRouter.put(
  '/attendance/sessions/:sessionId',
  underDevelopment,
  authorize('update', 'event'),
  validate(SessionAttendanceSchema),
  updateAttendance,
);
eventRouter.delete(
  '/attendance/sessions/:sessionId',
  underDevelopment,
  authorize('delete', 'event'),
  validate(SessionAttendanceSchema),
  removeAttendance,
);

//Programme-Participant route ------------------------------------------------------------------------------
eventRouter.post(
  '/programs/participants/:programmeId',
  underDevelopment,
  authorize('write', 'event'),
  addParticipantToProgramme,
);
eventRouter.delete(
  '/programs/participants/:programmeId/:participantId',
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
eventRouter.put(
  '/programs/:id',
  underDevelopment,
  authorize('update', 'event'),
  validate(updatedProgrammeSchema),
  editProgramme,
);
eventRouter.patch(
  '/programs/restore/:id',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteProgramme,
);

// Reminder session notification
eventRouter.get(
  '/programs/workshops/sessions/:sessionId', //create another route for this to get without having sessionId and checks through the database
  authorize('read', 'event'),
  reminderNotificationController,
);

export default eventRouter;
