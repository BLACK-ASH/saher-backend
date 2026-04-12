// constants/permissions.ts
export const ACTIONS = ["read", "write", "update", "delete"] as const;
export const RESOURCES = ["account", "user", "bank", "attendance", "attendance-correction", "holiday", "notification", "mail", "event"] as const;

export type Action = (typeof ACTIONS)[number];
export type Resource = (typeof RESOURCES)[number];

export const createPermission = (action: Action, resource: Resource) =>
  `${resource}:${action}`;
