import path from 'path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';

import adminRouter from './admin/admin.routes.js';
import attendanceRouter from './attendance/attendance.route.js';
import authRouter from './auth/auth.routes.js';
import { calendarRouter } from './calendar/calendar.routes.js';
import { corsOrigins } from './config/env.js';
import eventRouter from './events/events.routes.js';
import leaveRouter from './leave/leave.route.js';
import { httpLogger } from './libs/logger/http-logger.js';
import { register } from './libs/logger/metrics.js';
import errorHandler from './libs/middleware/error-handler.js';
import { metricsMiddleware } from './libs/middleware/metrics.js';
import { protectedRoute } from './libs/middleware/protected-route.js';
import { requestId } from './libs/middleware/request-id.js';
import { requestLogger } from './libs/middleware/request-logger.js';
import { requestTimer } from './libs/middleware/request-timer.js';
import { mailRouter } from './mail/mail.routes.js';
import noticeRouter from './notice/notice.routes.js';
import notificationRouter from './notification/notification.routes.js';
import payrollRouter from './payroll/payroll.routes.js';
import publicRouter from './public/public.routes.js';
import billRouter from './reimbursement/reimbursement.routes.js';
import uploadRouter from './upload/upload.routes.js';
import userRouter from './user/user.routes.js';

export const app = express();

// Middlewares
// 1. request id
app.use(requestId);

// 2. attach logger
app.use(httpLogger);

// 3. start timer
app.use(requestTimer);

// 4. log requests
app.use(requestLogger);

// 5. Metrics Middleware
app.use(metricsMiddleware);

app.set('trust proxy', true);

// CORS — reflect-all only when no allowlist is configured (dev); strict list otherwise
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  }),
);

// Upload routes get the raw stream (multer handles multipart) — no json parsing here
app.use(cookieParser());
app.use('/api/upload', protectedRoute, uploadRouter);
app.use(express.json());

// Rate limiting — auth endpoints are the brute-force target; generous global cap for the rest.
// ponytail: in-memory store — per-instance limits only; move to rate-limit-redis if clustered
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_AUTH) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, try again later.' },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_API) || 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/reimbursement', protectedRoute, billRouter);
app.use('/api', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/payroll', protectedRoute, payrollRouter);
app.use('/api/admin', protectedRoute, adminRouter);
app.use('/api/user', protectedRoute, userRouter);
app.use('/api/attendance', protectedRoute, attendanceRouter);
app.use('/api/events', protectedRoute, eventRouter);
app.use('/api/notification', protectedRoute, notificationRouter);
app.use('/api/mail', protectedRoute, mailRouter);
app.use('/api/notice', protectedRoute, noticeRouter);
app.use('/api/calendar', protectedRoute, calendarRouter);
app.use('/api/leave', protectedRoute, leaveRouter);

// Static Routes
app.use('/', express.static(path.join(process.cwd(), 'docs')));
app.use(express.static(path.join(process.cwd(), 'public')));
app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// Global Error Handling
app.use(errorHandler);

export default app;
