// constants/rolePermissions.ts
import { createPermission } from "./permission.js";

export const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  admin: new Set([
    // full access except read (implicitly allowed)
    // Account
    createPermission("write", "account"),
    createPermission("update", "account"),
    createPermission("delete", "account"),

    // User
    createPermission("write", "user"),
    createPermission("update", "user"),
    createPermission("delete", "user"),

    // Events
    createPermission("write", "holiday"),
    createPermission("update", "holiday"),
    createPermission("delete", "holiday"),

    // Bank
    createPermission("write", "bank"),
    createPermission("update", "bank"),
    createPermission("delete", "bank"),

    // Attendance 
    createPermission("write", "attendance"),
    createPermission("update", "attendance"),
  ]),

  manager: new Set([
    // Account 
    createPermission("write", "account"),
    createPermission("update", "account"),

    // User 
    createPermission("write", "user"),
    createPermission("update", "user"),

    // holiday 
    createPermission("write", "holiday"),
    createPermission("update", "holiday"),
    createPermission("delete", "holiday"),

    // Bank 
    createPermission("write", "bank"),
    createPermission("update", "bank"),

    // Attendance 
    createPermission("write", "attendance"),
    createPermission("update", "attendance"),
  ]),

  user: new Set([
    // Attendance 
    createPermission("write", "attendance"),
    createPermission("update","attendance")
  ]),
};
