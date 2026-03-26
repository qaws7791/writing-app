import { z } from "zod"

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    details: z.unknown().optional(),
    message: z.string(),
    requestId: z.string().optional(),
  }),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
