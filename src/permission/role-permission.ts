// constants/rolePermissions.ts
import { createPermission } from './permission.js';
import type { UserRole } from '../database/user.model.js';

export const ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
  admin: new Set([
    // Read
    createPermission('read', 'account'),
    createPermission('read', 'user'),
    createPermission('read', 'holiday'),
    createPermission('read', 'attendance'),
    createPermission('read', 'attendance-correction'),
    createPermission('read', 'event'),
    createPermission('read', 'mail'),
    createPermission('read', 'payroll'),
    createPermission('read', 'preReimbursement'),
    createPermission('read', 'postReimbursement'),
    createPermission('read', 'leaveType'),
    createPermission('read', 'leave'),
    createPermission('read', 'bank'),
    createPermission('read', 'notification'),
    createPermission('read', 'notice'),

    // Write
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

    // Attendance
    createPermission('write', 'attendance'),
    createPermission('update', 'attendance'),

    // Attendance Correction
    createPermission('write', 'attendance-correction'),
    createPermission('update', 'attendance-correction'),

    // Event
    createPermission('write', 'event'),
    createPermission('update', 'event'),
    createPermission('delete', 'event'),

    //Mail
    createPermission('write', 'mail'),

    // Payroll
    createPermission('write', 'payroll'),
    createPermission('update', 'payroll'),

    // Reimbursement
    createPermission('write', 'preReimbursement'),
    createPermission('update', 'preReimbursement'),
    createPermission('delete', 'preReimbursement'),
    createPermission('update', 'postReimbursement'),

    // LeaveType
    createPermission('write', 'leaveType'),
    createPermission('update', 'leaveType'),

    //Leave (Application )
    createPermission('write', 'leave'),
    createPermission('update', 'leave'),
  ]),

  manager: new Set([
    // Read
    createPermission('read', 'user'),
    createPermission('read', 'holiday'),
    createPermission('read', 'attendance'),
    createPermission('read', 'attendance-correction'),
    createPermission('read', 'event'),
    createPermission('read', 'mail'),
    createPermission('read', 'preReimbursement'),
    createPermission('read', 'postReimbursement'),
    createPermission('read', 'leave'),
    createPermission('read', 'bank'),
    createPermission('read', 'notification'),

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

    // Reimbursement
    createPermission('write', 'preReimbursement'),
    createPermission('update', 'preReimbursement'),
    createPermission('delete', 'preReimbursement'),
    createPermission('update', 'postReimbursement'),

    //Leave (Application )
    createPermission('write', 'leave'),
    createPermission('update', 'leave'),
  ]),

  user: new Set([
    // Read
    createPermission('read', 'event'),
    createPermission('read', 'attendance'),

    // Attendance
    createPermission('write', 'attendance'),

    // Attendance Correction
    createPermission('write', 'attendance-correction'),

    //Mail
    createPermission('write', 'mail'),

    //Notice
    createPermission('write', 'notice'),
    createPermission('update', 'notice'),
    createPermission('delete', 'notice'),
    // Reimbursement
    createPermission('write', 'postReimbursement'),
    createPermission('update', 'postReimbursement'),
    createPermission('delete', 'postReimbursement'),
    createPermission('update', 'preReimbursement'),

    //Leave (Application )
    createPermission('write', 'leave'),
    createPermission('update', 'leave'),
  ]),

  intern: new Set([createPermission('read', 'event')]),
};
