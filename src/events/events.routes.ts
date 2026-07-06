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
  addParticipantsToProgram,
  removeParticipantFromProgram,
} from './program/program-participant.controller.js';
import {
  addProgram,
  deleteProgram,
  editProgram,
  getPrograms,
  getSingleProgram,
  undoDeleteProgram,
} from './program/program.controller.js';
import { createProgramSchema, updatedProgramSchema } from './program/program.schema.js';
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
eventRouter.post(
  '/workshops/:programId',
  underDevelopment,
  authorize('write', 'event'),
  validate(createWorkshopSchema),
  addWorkshop,
);
eventRouter.delete(
  '/workshops/:id',
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

eventRouter.get(
  '/sessions/:sessionId',
  underDevelopment,
  authorize('read', 'event'),
  getSingleSession,
);

eventRouter.post(
  '/sessions/:programId',
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

//Program-Participant route ------------------------------------------------------------------------------
eventRouter.post(
  '/programs/participants/:programId',
  underDevelopment,
  authorize('write', 'event'),
  addParticipantsToProgram,
);
eventRouter.delete(
  '/programs/participants/:programId/:participantId',
  underDevelopment,
  authorize('delete', 'event'),
  removeParticipantFromProgram,
);

//Program routes ----------------------------------------------------------------------------------------------
eventRouter.get('/programs', underDevelopment, authorize('read', 'event'), getPrograms);
eventRouter.get('/programs/:id', underDevelopment, authorize('read', 'event'), getSingleProgram);
eventRouter.post(
  '/programs',
  underDevelopment,
  authorize('write', 'event'),
  validate(createProgramSchema),
  addProgram,
);
eventRouter.delete('/programs/:id', underDevelopment, authorize('delete', 'event'), deleteProgram);
eventRouter.put(
  '/programs/:id',
  underDevelopment,
  authorize('update', 'event'),
  validate(updatedProgramSchema),
  editProgram,
);
eventRouter.patch(
  '/programs/restore/:id',
  underDevelopment,
  authorize('update', 'event'),
  undoDeleteProgram,
);

// Reminder session notification
eventRouter.get(
  '/programs/workshops/sessions/:sessionId',
  authorize('read', 'event'),
  reminderNotificationController,
);

export default eventRouter;
