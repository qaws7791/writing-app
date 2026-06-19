import { defineAdminRoute } from "@/context/hono-env"
import { adminHealthResponseSchema, jsonResponse } from "@/http/openapi"

export const healthRoute = defineAdminRoute({
  method: "get",
  operationId: "getAdminHealth",
  path: "/health",
  responses: {
    200: jsonResponse("어드민 API 상태입니다.", adminHealthResponseSchema),
  },
  summary: "어드민 API 상태 조회",
  handler: (context) =>
    context.json(
      {
        ok: true,
        service: "admin-api",
      },
      200
    ),
})
