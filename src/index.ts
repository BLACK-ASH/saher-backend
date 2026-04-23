import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import adminRouter from './admin/admin.routes.js';
import authRouter from './auth/auth.routes.js';
import connectDb from './database/connection.js';
import { protectedRoute } from './libs/middleware/protected-route.js';
import attendanceRouter from './attendance/attendance.route.js';
import uploadRouter from './upload/upload.routes.js';
import errorHandler from './libs/middleware/error-handler.js';
import notificationRouter from './notification/notification.routes.js';
import { mailRouter } from './mail/mail.routes.js';
import userRouter from './user/user.routes.js';
import { connectRedis } from './libs/redis/redis-client.js';

// Env Config
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Route Login
app.use((req, res, next) => {
  // eslint-disable-next-line no-console
  console.log(req.method, req.url);
  next();
});

// Middlewares
// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// Image Upload Routes
app.use('/api/upload', uploadRouter);
app.use(express.json());
app.use(cookieParser());

// Databse Connection
await connectDb();
await connectRedis();

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', protectedRoute, adminRouter);
app.use('/api/user', protectedRoute, userRouter);
app.use('/api/attendance', protectedRoute, attendanceRouter);
app.use('/api/notification', protectedRoute, notificationRouter);
app.use('/api/mail', protectedRoute, mailRouter);

// Static Routes
app.use('/', express.static(path.join(process.cwd(), 'docs')));
app.use(express.static(path.join(process.cwd(), 'public')));

// To Check Services Is Healthy
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  if (dbStatus !== 1) {
    return res.status(500).json({ status: 'db not connected' });
  }
  res.status(200).json({ status: 'ok' });
});

// Global Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Server Started', PORT);
});
