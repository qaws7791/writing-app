import type { WritingAppDatabase } from "@workspace/db/client"

import { contentStatuses } from "#content/domain/content-model"

export const activeStatus = contentStatuses.active

export type WritingAppDatabaseTransaction = WritingAppDatabase
export type CourseReadDatabase = Pick<WritingAppDatabase, "select">

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("UNIQUE constraint failed")
  )
}
