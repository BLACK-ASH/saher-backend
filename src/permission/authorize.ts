// middlewares/authorize.ts
import type { Response, NextFunction, Request } from 'express';

import type { Action, Resource } from './permission.js';
import { createPermission } from './permission.js';
import { ROLE_PERMISSIONS } from './role-permission.js';
import type { UserRole } from '../database/user.model.js';
import { ApiError } from '../libs/class/api-error.js';

export const authorize = (action: Action, resource: Resource) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }

    // ✅ REMOVED: READ is no longer unconditionally allowed to all authenticated users.
    // Each route must have its permission explicitly configured, and we authorize against ROLE_PERMISSIONS.

    const role = user.role as UserRole;
    const permission = createPermission(action, resource);

    const allowedPermissions = ROLE_PERMISSIONS[role];

    if (!allowedPermissions || !allowedPermissions.has(permission)) {
      throw new ApiError(403, `You do not have permission to ${action} this ${resource}.`);
    }

    next();
  };
};
