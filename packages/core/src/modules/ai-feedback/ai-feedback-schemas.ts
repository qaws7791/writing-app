import { z } from "zod"

export const userLevelSchema = z.enum(["beginner", "intermediate", "advanced"])

export const writingFeedbackSchema = z.object({
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  question: z.string(),
})

export const revisionComparisonSchema = z.object({
  improvements: z.array(z.string()),
  summary: z.string(),
})

export const generateFeedbackBodySchema = z.object({
  level: userLevelSchema.optional().default("beginner"),
})

export const compareRevisionsBodySchema = z.object({
  originalText: z.string().min(1),
  revisedText: z.string().min(1),
})
