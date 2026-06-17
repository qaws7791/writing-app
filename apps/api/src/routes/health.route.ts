import { z } from "@hono/zod-openapi"

import { createRoute } from "@/lib/hono"
import { jsonResponse } from "@/lib/openapi-schemas"

const healthResponseSchema = z.object({
  ok: z.boolean(),
})

export function createHealthRoute() {
  return createRoute(
    {
      method: "get",
      operationId: "getHealth",
      path: "/",
      responses: {
        200: jsonResponse("API 상태입니다.", healthResponseSchema),
      },
      summary: "API 상태 조회",
    },
    (context) =>
      context.json(
        {
          ok: true,
        },
        200
      )
  )
}
