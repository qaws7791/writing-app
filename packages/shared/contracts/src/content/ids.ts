import { z } from "zod"
import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

export type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

function createIdSchema<TId extends string>() {
  return z
    .string()
    .min(1)
    .transform((value) => value as TId)
}

export const courseIdSchema = createIdSchema<CourseId>()
export const contentAssetIdSchema = createIdSchema<ContentAssetId>()
export const curriculumVersionIdSchema = createIdSchema<CurriculumVersionId>()
export const unitIdSchema = createIdSchema<UnitId>()
export const lessonIdSchema = createIdSchema<LessonId>()
export const lessonStepIdSchema = createIdSchema<LessonStepId>()
