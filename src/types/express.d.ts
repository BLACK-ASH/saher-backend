import 'express';
import { UserRole } from '../database/user.model.ts';

declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
      user?: {
        id: string;
        name: string;
        role: UserRole;
        email: string;
      };
    }
  }
}
