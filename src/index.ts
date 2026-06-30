import path from 'path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import adminRouter from './admin/admin.routes.js';
import attendanceRouter from './attendance/attendance.route.js';
import authRouter from './auth/auth.routes.js';
import { calendarRouter } from './calendar/calendar.routes.js';
import connectDb from './database/connection.js';
import eventRouter from './events/events.routes.js';
import leaveRouter from './leave/leave.route.js';
import { httpLogger } from './libs/logger/http-logger.js';
import { logger } from './libs/logger/logger.js';
import { register } from './libs/logger/metrics.js';
import { underDevelopment } from './libs/middleware/development.js';
import errorHandler from './libs/middleware/error-handler.js';
import { metricsMiddleware } from './libs/middleware/metrics.js';
import { protectedRoute } from './libs/middleware/protected-route.js';
import { requestId } from './libs/middleware/request-id.js';
import { requestLogger } from './libs/middleware/request-logger.js';
import { requestTimer } from './libs/middleware/request-timer.js';
import { connectRedis } from './libs/redis/redis-client.js';
import { mailRouter } from './mail/mail.routes.js';
import notificationRouter from './notification/notification.routes.js';
import publicRouter from './public/public.routes.js';
import billRouter from './reimbursement/reimbursement.routes.js';
import uploadRouter from './upload/upload.routes.js';
import userRouter from './user/user.routes.js';
import payrollRouter from './payroll/payroll.routes.js';

// Env Config
// dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

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

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// Image Upload Routes
app.use(express.json());
app.use('/api/upload', uploadRouter);
app.use(cookieParser());

// Databse Connection
await connectDb();

//Redis Server Connnection
await connectRedis();

// Routes
app.use('/api/reimbursement', protectedRoute, billRouter);
app.use('/api', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/payroll', protectedRoute, payrollRouter);
app.use('/api/admin', protectedRoute, adminRouter);
app.use('/api/user', protectedRoute, userRouter);
app.use('/api/attendance', protectedRoute, attendanceRouter);
app.use('/api/events', underDevelopment, protectedRoute, eventRouter);
app.use('/api/notification', protectedRoute, notificationRouter);
app.use('/api/mail', underDevelopment, protectedRoute, mailRouter);
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

app.listen(PORT, () => {
  logger.info(`server started at http://localhost:${PORT}`);
});
