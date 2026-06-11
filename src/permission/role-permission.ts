// constants/rolePermissions.ts
import { createPermission } from './permission.js';

export const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  admin: new Set([
    // Full access except read (implicitly allowed)
    // Account
    createPermission('write', 'account'),
    createPermission('update', 'account'),
    createPermission('delete', 'account'),

    // User
    createPermission('write', 'user'),
    createPermission('update', 'user'),
    createPermission('delete', 'user'),

    // Holiday
    createPermission('write', 'holiday'),
    createPermission('update', 'holiday'),
    createPermission('delete', 'holiday'),

    // Event
    createPermission('write', 'event'),
    createPermission('update', 'event'),
    createPermission('delete', 'event'),

    //Mail
    createPermission('write', 'mail'),

    //Mail
    createPermission('write', 'mail'),
  ]),

  manager: new Set([
    // Account
    createPermission('write', 'account'),
    createPermission('update', 'account'),

    // User
    createPermission('write', 'user'),
    createPermission('update', 'user'),

    // holiday
    createPermission('write', 'holiday'),
    createPermission('update', 'holiday'),
    createPermission('delete', 'holiday'),

    // Bank
    createPermission('write', 'bank'),
    createPermission('update', 'bank'),

    // Attendance
    createPermission('write', 'attendance'),
    createPermission('update', 'attendance'),

    // Attendance Correction
    createPermission('write', 'attendance-correction'),
    createPermission('update', 'attendance-correction'),

    // Event
    createPermission('write', 'event'),
    createPermission('update', 'event'),

    //Notification
    createPermission('write', 'notification'),
    createPermission('update', 'notification'),
    createPermission('delete', 'notification'),

    //Mail
    createPermission('write', 'mail'),
  ]),

  user: new Set([
    // Attendance
    createPermission('write', 'attendance'),

    // Attendance Correction
    createPermission('write', 'attendance-correction'),

    // Event
    // createPermission('write', 'event'),

    //Mail
    createPermission('write', 'mail'),
  ]),
};
