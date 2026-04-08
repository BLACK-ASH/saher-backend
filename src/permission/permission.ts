// constants/permissions.ts
export const ACTIONS = ["read", "write", "update", "delete"] as const;
<<<<<<< HEAD
export const RESOURCES = ["account","user","bank","attendance","attendance-correction", "holiday","event"] as const;
=======
export const RESOURCES = ["account","user","bank","attendance","attendance-correction", "holiday" ] as const;
>>>>>>> 965de6c3c97cb8346479a51462f86a7ddea90563

export type Action = (typeof ACTIONS)[number];
export type Resource = (typeof RESOURCES)[number];

export const createPermission = (action: Action, resource: Resource) =>
  `${resource}:${action}`;
