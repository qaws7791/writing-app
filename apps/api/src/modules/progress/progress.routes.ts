import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { learnerIdSchema } from "@workspace/contracts/learning/read-data"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { unwrapApiCoreResult } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  decodeLearnerProgressListQuery,
  encodeLearnerProgressPage,
} from "@/http/learner-read-route-mapper"
import {
  progressQuerySchema,
  progressResponseSchema,
} from "@/modules/progress/progress.schemas"

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
  const cursorCodec = context.var.requestContext.learnerCursorCodec
  const query = unwrapApiCoreResult(
    decodeLearnerProgressListQuery(
      cursorCodec,
      learnerIdSchema.parse(context.var.activeSession.user.id),
      context.req.valid("query")
    )
  )
  const page = await progressService.readProgress(query)

  return context.json(
    parseLearnerRouteResponse(
      context,
      "LearnerProgressResponse",
      progressResponseSchema,
      encodeLearnerProgressPage(cursorCodec, query, page)
    ),
    200
  )
}

export const progressRoute = defineApiRoute({
  ...progressRouteConfig,
  handler: progressHandler,
})
