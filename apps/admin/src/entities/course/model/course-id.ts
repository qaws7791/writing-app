import { z } from "zod"
import type { CourseId } from "@workspace/contracts/content/ids"

export type { CourseId } from "@workspace/contracts/content/ids"

export const courseIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .transform((value) => value as CourseId)
