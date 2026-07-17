import { defineApiRoute } from "@/context/hono-env"
import { jsonResponse } from "@/http/openapi"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { z } from "@/http/platform/zod"

const healthResponseSchema = z.strictObject({
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
      parseLearnerRouteResponse(
        context,
        "HealthResponse",
        healthResponseSchema,
        {
          ok: true,
        }
      ),
      200
    ),
})
