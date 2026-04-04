import "express";
import { UserRole } from "../database/user.model.ts";
import { EmployeeType } from "../database/account.model.ts";

declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
      user?: {
        id: string,
        name: string,
        role: UserRole,
        employeeType: EmployeeType
      }
    }
  }
}
