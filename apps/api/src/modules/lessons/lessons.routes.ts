import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { learnerApiErrorSchema } from "@workspace/contracts/learning/api-error"
import { learnerIdSchema } from "@workspace/contracts/learning/read-data"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { unwrapApiCoreResult } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  lessonDtoSchema,
  lessonParamsSchema,
} from "@/modules/lessons/lessons.schemas"

const getLessonRouteConfig = {
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getLesson",
  path: "/lessons/{lessonId}",
  request: {
    params: lessonParamsSchema,
  },
  responses: {
    ...authenticatedResponses(
      jsonResponse("레슨 상세입니다.", lessonDtoSchema)
    ),
    404: jsonResponse("레슨을 찾을 수 없습니다.", learnerApiErrorSchema),
  },
  security: [{ learnerSessionCookie: [] }],
  summary: "레슨 상세 조회",
} satisfies AnyRouteConfig

const getLessonHandler: ApiRouteHandler<typeof getLessonRouteConfig> = async (
  context
) => {
  const contentService = context.var.requestContext.contentService

  const { lessonId } = context.req.valid("param")
  const result = await contentService.getLesson({
    lessonId,
    userId: learnerIdSchema.parse(context.var.activeSession.user.id),
  })

  return context.json(
    parseLearnerRouteResponse(
      context,
      "LearnerLessonResponse",
      lessonDtoSchema,
      unwrapApiCoreResult(result)
    ),
    200
  )
}

export const getLessonRoute = defineApiRoute({
  ...getLessonRouteConfig,
  handler: getLessonHandler,
})
