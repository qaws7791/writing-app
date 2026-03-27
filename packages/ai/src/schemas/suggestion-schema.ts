import { z } from "zod"

export const aiSuggestionOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      suggestion: z.string().describe("개선된 대안 텍스트"),
      reason: z.string().describe("개선 이유를 간결한 한국어로"),
    })
  ),
})

export type AISuggestionOutput = z.infer<typeof aiSuggestionOutputSchema>
