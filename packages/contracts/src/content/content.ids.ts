import { z } from "zod"
import type { Brand } from "@workspace/contracts/brand"

export type { Brand } from "@workspace/contracts/brand"

export type CourseId = Brand<string, "CourseId">
export type UnitId = Brand<string, "UnitId">
export type LessonId = Brand<string, "LessonId">
export type LessonStepId = Brand<string, "LessonStepId">

function createIdSchema<TId extends string>() {
  return z
    .string()
    .min(1)
    .transform((value) => value as TId)
}

export const courseIdSchema = createIdSchema<CourseId>()
export const unitIdSchema = createIdSchema<UnitId>()
export const lessonIdSchema = createIdSchema<LessonId>()
export const lessonStepIdSchema = createIdSchema<LessonStepId>()
