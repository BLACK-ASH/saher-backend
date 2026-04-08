// constants/rolePermissions.ts
import { createPermission } from "./permission.js";

export const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  admin: new Set([
    // Full access except read (implicitly allowed)
    // Account
    createPermission("write", "account"),
    createPermission("update", "account"),
    createPermission("delete", "account"),

    // User
    createPermission("write", "user"),
    createPermission("update", "user"),
    createPermission("delete", "user"),

<<<<<<< HEAD
    // Holiday
=======
    // Holiday 
>>>>>>> 965de6c3c97cb8346479a51462f86a7ddea90563
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

    // Attendance Correction
    createPermission("write", "attendance-correction"),
    createPermission("update", "attendance-correction"),

<<<<<<< HEAD
    // Event
    createPermission("write", "event"),
    createPermission("update", "event"),
    createPermission("delete", "event"),

=======
>>>>>>> 965de6c3c97cb8346479a51462f86a7ddea90563
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

    // Attendance Correction
    createPermission("write", "attendance-correction"),
    createPermission("update", "attendance-correction"),

    // Event
    createPermission("write", "event"),
    createPermission("update", "event"),
  ]),

  user: new Set([
    // Attendance 
    createPermission("write", "attendance"),

    // Attendance Correction
    createPermission("write", "attendance-correction"),

    // Event
    createPermission("write", "event"),
  ]),
};
