import { z } from "zod"

export const compareOutputSchema = z.object({
  improvements: z.array(z.string()),
  summary: z.string(),
})
