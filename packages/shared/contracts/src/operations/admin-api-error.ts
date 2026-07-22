import { z } from "zod"

const adminApiErrorViolationSchema = z.strictObject({
  code: z.string().optional(),
  message: z.string(),
  path: z.string(),
})

export const adminApiErrorSchema = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]*$/u),
  errors: z.array(adminApiErrorViolationSchema).optional(),
  message: z.string(),
  requestId: z.string().min(1).optional(),
})

export type AdminApiErrorResponse = z.infer<typeof adminApiErrorSchema>
