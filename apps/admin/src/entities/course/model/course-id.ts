import { z } from "zod"

declare const courseIdBrand: unique symbol

export type CourseId = string & {
  readonly [courseIdBrand]: true
}

export const courseIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .transform((value) => value as CourseId)
