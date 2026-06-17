import { z } from "zod"
import {
  persistedContentStatuses,
  persistedContentStatusValues,
  persistedLearnerAccountStatuses,
  persistedLearnerAccountStatusValues,
  persistedLessonProgressStatuses,
  persistedLessonProgressStatusValues,
} from "@workspace/db/persisted-values"

export const contentStatuses = persistedContentStatuses
export const contentStatusValues = persistedContentStatusValues
export const contentStatusSchema = z.enum(contentStatusValues)

export const learnerAccountStatuses = persistedLearnerAccountStatuses
export const learnerAccountStatusValues = persistedLearnerAccountStatusValues
export const learnerAccountStatusSchema = z.enum(learnerAccountStatusValues)

export const learnerOperationalStatusValues = [
  learnerAccountStatuses.active,
  learnerAccountStatuses.suspended,
] as const
export const learnerOperationalStatusSchema = z.enum(
  learnerOperationalStatusValues
)

export const lessonProgressStatuses = persistedLessonProgressStatuses
export const lessonProgressStatusValues = persistedLessonProgressStatusValues
export const lessonProgressStatusSchema = z.enum(lessonProgressStatusValues)

export type ContentStatus = z.infer<typeof contentStatusSchema>
export type LearnerAccountStatus = z.infer<typeof learnerAccountStatusSchema>
export type LearnerOperationalStatus = z.infer<
  typeof learnerOperationalStatusSchema
>
export type LessonProgressStatus = z.infer<typeof lessonProgressStatusSchema>
