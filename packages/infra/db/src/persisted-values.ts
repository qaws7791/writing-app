export const persistedContentStatuses = {
  active: "active",
  archived: "archived",
} as const
export const persistedContentStatusValues = [
  persistedContentStatuses.active,
  persistedContentStatuses.archived,
] as const

export const persistedLessonProgressStatuses = {
  completed: "completed",
  inProgress: "in_progress",
} as const
export const persistedLessonProgressStatusValues = [
  persistedLessonProgressStatuses.inProgress,
  persistedLessonProgressStatuses.completed,
] as const

export const persistedAdminRoles = {
  operator: "operator",
  owner: "owner",
} as const
export const persistedAdminRoleValues = [
  persistedAdminRoles.owner,
  persistedAdminRoles.operator,
] as const

export const persistedCourseVisualKeyValues = [
  "basic-sentence-writing",
  "grammar-complete",
  "essay-writing",
  "creative-writing",
  "expression",
] as const

export type PersistedContentStatus =
  (typeof persistedContentStatusValues)[number]
export type PersistedLessonProgressStatus =
  (typeof persistedLessonProgressStatusValues)[number]
export type PersistedAdminRole = (typeof persistedAdminRoleValues)[number]
export type PersistedCourseVisualKey =
  (typeof persistedCourseVisualKeyValues)[number]
