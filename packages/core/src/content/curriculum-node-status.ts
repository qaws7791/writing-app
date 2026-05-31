import { z } from "zod"

export const curriculumNodeStatuses = [
  "active",
  "deprecated",
  "archived",
] as const

export const curriculumNodeStatusSchema = z.enum(curriculumNodeStatuses)

export type CurriculumNodeStatus = (typeof curriculumNodeStatuses)[number]
