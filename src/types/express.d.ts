import type { UserRole } from '../database/user.model.js';

declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
      id: string;
      startTime: number;
      user?: {
        id: string;
        name: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

export {}; // 👈 IMPORTANT (makes file a module)
