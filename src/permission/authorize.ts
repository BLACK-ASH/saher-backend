// middlewares/authorize.ts
import { Response, NextFunction, Request } from 'express';
import { Action, createPermission, Resource } from './permission.js';
import { ROLE_PERMISSIONS } from './role-permission.js';

export const authorize = (action: Action, resource: Resource) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ READ is allowed for all authenticated users
    if (action === 'read') {
      return next();
    }

    const role = user.role;
    const permission = createPermission(action, resource);

    const allowedPermissions = ROLE_PERMISSIONS[role];

    if (!allowedPermissions || !allowedPermissions.has(permission)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to ${action} this ${resource}.`,
      });
    }

    next();
  };
};
