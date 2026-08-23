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
  getParticipantsFromProgram,
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
import {
  addParticipantsToProgramSchema,
  createProgramSchema,
  updatedProgramSchema,
} from './program/program.schema.js';
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
eventRouter.get('/workshops', authorize('read', 'event'), getWorkshops);
eventRouter.get('/workshops/:workshopId', authorize('read', 'event'), getSingleWorkshop);
eventRouter.post(
  '/workshops/:programId',
  authorize('write', 'event'),
  validate(createWorkshopSchema),
  addWorkshop,
);
eventRouter.delete('/workshops/:id', authorize('delete', 'event'), deleteWorkshop);
eventRouter.put(
  '/workshops/:id',
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
eventRouter.get('/sessions', authorize('read', 'event'), getSessions);
eventRouter.get('/sessions/:sessionId', authorize('read', 'event'), getSingleSession);
eventRouter.post(
  '/sessions/:programId',
  authorize('write', 'event'),
  validate(createSessionSchema),
  addSession,
);
eventRouter.delete('/sessions/:id', authorize('delete', 'event'), deleteSession);
eventRouter.put(
  '/sessions/:id',
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
eventRouter.get('/participants', authorize('read', 'event'), getParticipants);
eventRouter.get('/participants/:id', authorize('read', 'event'), getParticipantByIdController);
eventRouter.post(
  '/participants',
  authorize('write', 'event'),
  validate(participantSchema),
  addParticipantController,
);
eventRouter.delete('/participants/:id', authorize('delete', 'event'), deleteParticipantController);
eventRouter.put(
  '/participants/:id',
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
  authorize('write', 'event'),
  validate(SessionAttendanceSchema),
  markAttendance,
);
eventRouter.put(
  '/attendance/sessions/:sessionId',
  authorize('update', 'event'),
  validate(SessionAttendanceSchema),
  updateAttendance,
);
eventRouter.delete(
  '/attendance/sessions/:sessionId',
  authorize('delete', 'event'),
  validate(SessionAttendanceSchema),
  removeAttendance,
);

//Program-Participant route ------------------------------------------------------------------------------
eventRouter.get(
  '/programs/participants/:programId',
  authorize('read', 'event'),
  getParticipantsFromProgram,
);
eventRouter.post(
  '/programs/participants/:programId',
  authorize('write', 'event'),
  validate(addParticipantsToProgramSchema),
  addParticipantsToProgram,
);
eventRouter.delete(
  '/programs/participants/:programId/:participantId',
  authorize('delete', 'event'),
  removeParticipantFromProgram,
);

//Program routes ----------------------------------------------------------------------------------------------
eventRouter.get('/programs', authorize('read', 'event'), getPrograms);
eventRouter.get('/programs/:id', authorize('read', 'event'), getSingleProgram);
eventRouter.post(
  '/programs',
  authorize('write', 'event'),
  validate(createProgramSchema),
  addProgram,
);
eventRouter.delete('/programs/:id', authorize('delete', 'event'), deleteProgram);
eventRouter.put(
  '/programs/:id',
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
