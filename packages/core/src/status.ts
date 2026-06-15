import { z } from "zod"

export const contentStatuses = {
  active: "active",
  archived: "archived",
} as const
export const contentStatusValues = [
  contentStatuses.active,
  contentStatuses.archived,
] as const
export const contentStatusSchema = z.enum(contentStatusValues)

export const learnerAccountStatuses = {
  active: "active",
  suspended: "suspended",
  deleted: "deleted",
} as const
export const learnerAccountStatusValues = [
  learnerAccountStatuses.active,
  learnerAccountStatuses.suspended,
  learnerAccountStatuses.deleted,
] as const
export const learnerAccountStatusSchema = z.enum(learnerAccountStatusValues)

export const learnerOperationalStatusValues = [
  learnerAccountStatuses.active,
  learnerAccountStatuses.suspended,
] as const
export const learnerOperationalStatusSchema = z.enum(
  learnerOperationalStatusValues
)

export const lessonProgressStatuses = {
  inProgress: "in_progress",
  completed: "completed",
} as const
export const lessonProgressStatusValues = [
  lessonProgressStatuses.inProgress,
  lessonProgressStatuses.completed,
] as const
export const lessonProgressStatusSchema = z.enum(lessonProgressStatusValues)

export type ContentStatus = z.infer<typeof contentStatusSchema>
export type LearnerAccountStatus = z.infer<typeof learnerAccountStatusSchema>
export type LearnerOperationalStatus = z.infer<
  typeof learnerOperationalStatusSchema
>
export type LessonProgressStatus = z.infer<typeof lessonProgressStatusSchema>
