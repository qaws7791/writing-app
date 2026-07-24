import { z } from "zod"

export const apiErrorViolationSchema = z.strictObject({
  code: z.string().optional(),
  message: z.string(),
  path: z.string(),
})

export const apiErrorSchema = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]*$/u),
  message: z.string(),
  requestId: z.string().min(1),
  violations: z.array(apiErrorViolationSchema).optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>

export function parseApiError(
  value: unknown,
  fallbackRequestId = "unavailable"
): ApiError {
  const parsed = apiErrorSchema.safeParse(value)
  if (parsed.success) return parsed.data

  return {
    code: "CONTRACT_ERROR",
    message: "API 응답을 해석할 수 없습니다.",
    requestId: fallbackRequestId,
  }
}
