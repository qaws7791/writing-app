import type { AnyRouteConfig } from "@workspace/hono/core"
import { ErrorResponseSchema } from "@workspace/hono/errors"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { mapCoreError } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
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
    404: jsonResponse("레슨을 찾을 수 없습니다.", ErrorResponseSchema),
  },
  security: [{ bearerAuth: [] }],
  summary: "레슨 상세 조회",
} satisfies AnyRouteConfig

const getLessonHandler: ApiRouteHandler<typeof getLessonRouteConfig> = async (
  context
) => {
  const contentService = context.var.requestContext.contentService

  const { lessonId } = context.req.valid("param")
  const result = await contentService.getLesson(lessonId)

  if (result.kind === "err") {
    throw mapCoreError(result.error)
  }

  return context.json(result.value, 200)
}

export const getLessonRoute = defineApiRoute({
  ...getLessonRouteConfig,
  handler: getLessonHandler,
})
