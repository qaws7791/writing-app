import { z } from "zod"

import type { Brand } from "@workspace/contracts/content/content.ids"

export type LearnerId = Brand<string, "LearnerId">
export type CurriculumVersionId = Brand<string, "CurriculumVersionId">
export type LessonStepItemId = Brand<string, "LessonStepItemId">

function createIdSchema<TId extends string>() {
  return z
    .string()
    .min(1)
    .transform((value) => value as TId)
}

export const learnerIdSchema = createIdSchema<LearnerId>()
export const curriculumVersionIdSchema = createIdSchema<CurriculumVersionId>()
export const lessonStepItemIdSchema = createIdSchema<LessonStepItemId>()
