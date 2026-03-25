import { z } from "zod"

export const authApiErrorSchema = z.object({
  message: z.string(),
  status: z.number().optional(),
})

export type AuthApiError = z.infer<typeof authApiErrorSchema>

export function parseAuthApiError(error: unknown): AuthApiError | null {
  const result = authApiErrorSchema.safeParse(error)
  return result.success ? result.data : null
}
