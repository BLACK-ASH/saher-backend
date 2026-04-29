// middlewares/authorize.ts
import { Response, NextFunction, Request } from 'express';
import { Action, createPermission, Resource } from './permission.js';
import { ROLE_PERMISSIONS } from './role-permission.js';
import { ApiResponse } from '../libs/class/api-response.js';

export const authorize = (action: Action, resource: Resource) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return ApiResponse.success(res, {
        message: 'Unauthorized',
        data: undefined,
        statusCode: 401,
      });
    }

    // ✅ READ is allowed for all authenticated users
    if (action === 'read') {
      return next();
    }

    const role = user.role;
    const permission = createPermission(action, resource);

    const allowedPermissions = ROLE_PERMISSIONS[role];

    if (!allowedPermissions || !allowedPermissions.has(permission)) {
      return ApiResponse.success(res, {
        message: `You do not have permission to ${action} this ${resource}.`,
        data: undefined,
        statusCode: 403,
      });
    }

    next();
  };
};
