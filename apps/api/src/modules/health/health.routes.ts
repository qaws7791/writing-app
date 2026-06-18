import { defineApiRoute } from "@/context/hono-env"
import { jsonResponse } from "@/http/openapi"
import { z } from "@workspace/hono/zod"

const healthResponseSchema = z.object({
  ok: z.boolean(),
})

export const healthRoute = defineApiRoute({
  method: "get",
  operationId: "getHealth",
  path: "/health",
  responses: {
    200: jsonResponse("API 상태입니다.", healthResponseSchema),
  },
  summary: "API 상태 조회",
  handler: (context) =>
    context.json(
      {
        ok: true,
      },
      200
    ),
})
