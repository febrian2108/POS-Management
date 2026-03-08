export const ROLES = {
  OWNER: "OWNER",
  WORKER: "WORKER"
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];
