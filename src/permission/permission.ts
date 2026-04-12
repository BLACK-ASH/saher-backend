// constants/permissions.ts
export const ACTIONS = ["read", "write", "update", "delete"] as const;
<<<<<<< HEAD
export const RESOURCES = ["account","user","bank","attendance","attendance-correction", "holiday", "event" ] as const;
=======
export const RESOURCES = ["account","user","bank","attendance","attendance-correction", "holiday" , "notification", "mail"] as const;
>>>>>>> c3270e551926b6518c951014aecbdf731780a87b

export type Action = (typeof ACTIONS)[number];
export type Resource = (typeof RESOURCES)[number];

export const createPermission = (action: Action, resource: Resource) =>
  `${resource}:${action}`;
