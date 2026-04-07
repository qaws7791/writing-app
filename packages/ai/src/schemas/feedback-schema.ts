import { z } from "zod"

export const feedbackOutputSchema = z.object({
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  question: z.string(),
})
