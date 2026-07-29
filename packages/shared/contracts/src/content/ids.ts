import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

import { createIdentifierSchema } from "#contracts/identifier"

export type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

export const courseIdSchema = createIdentifierSchema<CourseId>()
export const contentAssetIdSchema = createIdentifierSchema<ContentAssetId>()
export const curriculumVersionIdSchema =
  createIdentifierSchema<CurriculumVersionId>()
export const unitIdSchema = createIdentifierSchema<UnitId>()
export const lessonIdSchema = createIdentifierSchema<LessonId>()
export const lessonStepIdSchema = createIdentifierSchema<LessonStepId>()
