import { z } from "zod"

export const aiFeatureTypeSchema = z.enum(["vocabulary", "clarity", "rhythm"])

export const aiSuggestionSchema = z.object({
  id: z.string(),
  original: z.string(),
  suggestion: z.string(),
  reason: z.string(),
})

export const reviewItemTypeSchema = z.enum(["spelling", "duplicate", "flow"])

export const reviewItemSchema = z.object({
  id: z.string(),
  type: reviewItemTypeSchema,
  from: z.number().int(),
  to: z.number().int(),
  original: z.string(),
  suggestion: z.string(),
  reason: z.string(),
})

export const aiReviewParagraphSchema = z.object({
  from: z.number().int(),
  to: z.number().int(),
  text: z.string().min(1),
})

export const aiSuggestionInputSchema = z.object({
  text: z.string().min(1).max(2000),
  type: aiFeatureTypeSchema,
})

export const aiDocumentReviewInputSchema = z.object({
  paragraphs: z.array(aiReviewParagraphSchema).min(1).max(100),
})

export const aiFlowReviewInputSchema = z.object({
  paragraphs: z.array(aiReviewParagraphSchema).min(2).max(100),
})

export const aiSuggestionResponseSchema = z.object({
  suggestions: z.array(aiSuggestionSchema),
})

export const aiReviewResponseSchema = z.object({
  items: z.array(reviewItemSchema),
})
