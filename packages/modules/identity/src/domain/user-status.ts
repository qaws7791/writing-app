export const userStatuses = Object.freeze({
  active: "active",
  deleted: "deleted",
  suspended: "suspended",
} as const)

export const userStatusValues = Object.freeze([
  userStatuses.active,
  userStatuses.suspended,
  userStatuses.deleted,
] as const)

export type UserStatus = (typeof userStatusValues)[number]

export function isUserStatus(value: unknown): value is UserStatus {
  return userStatusValues.some((status) => status === value)
}
