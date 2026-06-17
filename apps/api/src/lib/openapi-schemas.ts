import { z } from "@hono/zod-openapi"
import { learnerAccountStatusSchema } from "@workspace/core/status"

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    detail: z
      .object({
        code: z.enum([
          "invalid_body",
          "malformed_json",
          "unknown_body_read_error",
        ]),
      })
      .optional(),
  }),
})

export const learnerUserSchema = z.object({
  email: z.string(),
  id: z.string(),
  image: z.string().nullable(),
  joinedAt: z.string().datetime(),
  name: z.string(),
  status: learnerAccountStatusSchema,
})

export const savedResponseSchema = z.object({
  saved: z.boolean(),
})

export function jsonResponse(description: string, schema: z.ZodType) {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    description,
  }
}

export function authenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: jsonResponse("인증이 필요합니다.", errorResponseSchema),
    403: jsonResponse("계정을 사용할 수 없습니다.", errorResponseSchema),
  }
}
