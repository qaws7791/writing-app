/** Exported singleton used by authorization checks; runtime mutation must not redefine a status. */
export const userStatuses = Object.freeze({
  active: "active",
  deleted: "deleted",
  suspended: "suspended",
} as const)

/** Exported singleton shared by validation and persistence mappings. */
export const userStatusValues = Object.freeze([
  userStatuses.active,
  userStatuses.suspended,
  userStatuses.deleted,
] as const)

export type UserStatus = (typeof userStatusValues)[number]
