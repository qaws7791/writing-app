import { z } from "zod"

export const lessonProgressStatuses = {
  completed: "completed",
  inProgress: "in_progress",
} as const
export const lessonProgressStatusValues = [
  lessonProgressStatuses.inProgress,
  lessonProgressStatuses.completed,
] as const
export const lessonProgressStatusSchema = z.enum(lessonProgressStatusValues)

export type LessonProgressStatus = z.infer<typeof lessonProgressStatusSchema>
