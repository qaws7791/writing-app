import { z } from "zod"
import type { LearnerId, LessonStepItemId } from "@workspace/types/ids"

export type { LearnerId, LessonStepItemId } from "@workspace/types/ids"

function createIdSchema<TId extends string>() {
  return z
    .string()
    .min(1)
    .transform((value) => value as TId)
}

export const learnerIdSchema = createIdSchema<LearnerId>()
export const lessonStepItemIdSchema = createIdSchema<LessonStepItemId>()
