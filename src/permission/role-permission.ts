// constants/rolePermissions.ts

import { createPermission } from "./permission.js";

export const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  admin: new Set([
    // full access except read (implicitly allowed)
    createPermission("write", "account"),
    createPermission("update", "account"),
    createPermission("delete", "account"),

    createPermission("write", "user"),
    createPermission("update", "user"),
    createPermission("delete", "user"),

    createPermission("write", "event"),
    createPermission("update", "event"),
    createPermission("delete", "event"),

    createPermission("write", "bank"),
    createPermission("update", "bank"),
    createPermission("delete", "bank"),
  ]),

  manager: new Set([
    createPermission("write", "account"),
    createPermission("update", "account"),

    createPermission("write", "user"),
    createPermission("update", "user"),

    createPermission("write", "event"),
    createPermission("update", "event"),

    createPermission("write", "bank"),
    createPermission("update", "bank"),
  ]),

  user: new Set([
    createPermission("write", "event"), // e.g. participation / creation
  ]),
};
