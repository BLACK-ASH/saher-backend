// constants/permissions.ts
export const ACTIONS = ["read", "write", "update", "delete"] as const;
<<<<<<< HEAD
export const RESOURCES = ["account","user","bank","attendance","attendance-correction", "holiday" , "notification", "mail", "event"] as const;
=======

export const RESOURCES = ["account", "user", "bank", "attendance", "attendance-correction", "holiday", "notification", "mail", "event"] as const;

>>>>>>> 2af9c9b3a9983123bdfe2e8de610efcc5403540a

export type Action = (typeof ACTIONS)[number];
export type Resource = (typeof RESOURCES)[number];

export const createPermission = (action: Action, resource: Resource) =>
  `${resource}:${action}`;
