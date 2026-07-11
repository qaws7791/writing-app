import { z } from "zod"
import type { AnyRouteConfig } from "@workspace/hono/core"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  progressCourseStatusFilterSchema,
  progressResponseSchema,
} from "@/modules/progress/progress.schemas"

const progressQuerySchema = z.object({
  status: progressCourseStatusFilterSchema.optional(),
})

const progressRouteConfig = {
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getProgress",
  path: "/progress",
  request: {
    query: progressQuerySchema,
  },
  responses: authenticatedResponses(
    jsonResponse("학습자의 코스별 진행 상태입니다.", progressResponseSchema)
  ),
  security: [{ learnerSessionCookie: [] }],
  summary: "학습 진행 조회",
} satisfies AnyRouteConfig

const progressHandler: ApiRouteHandler<typeof progressRouteConfig> = async (
  context
) => {
  const progressService = context.var.requestContext.progressService
  const { status } = context.req.valid("query")

  return context.json(
    await progressService.readProgress(context.var.activeSession.user.id, {
      status,
    }),
    200
  )
}

export const progressRoute = defineApiRoute({
  ...progressRouteConfig,
  handler: progressHandler,
})
