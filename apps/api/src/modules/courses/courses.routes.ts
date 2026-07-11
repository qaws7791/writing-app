import type { AnyRouteConfig } from "@workspace/hono/core"
import { ErrorResponseSchema } from "@workspace/hono/errors"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { unwrapApiCoreResult } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  courseDetailDtoSchema,
  courseListDtoSchema,
  courseParamsSchema,
} from "@/modules/courses/courses.schemas"

const listCoursesRouteConfig = {
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getCourses",
  path: "/courses",
  responses: authenticatedResponses(
    jsonResponse("학습 가능한 코스 목록입니다.", courseListDtoSchema)
  ),
  security: [{ learnerSessionCookie: [] }],
  summary: "코스 목록 조회",
} satisfies AnyRouteConfig

const listCoursesHandler: ApiRouteHandler<
  typeof listCoursesRouteConfig
> = async (context) => {
  const contentService = context.var.requestContext.contentService

  return context.json(await contentService.listCourses(), 200)
}

export const listCoursesRoute = defineApiRoute({
  ...listCoursesRouteConfig,
  handler: listCoursesHandler,
})

const getCourseDetailRouteConfig = {
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getCourseDetail",
  path: "/courses/{courseId}",
  request: {
    params: courseParamsSchema,
  },
  responses: {
    ...authenticatedResponses(
      jsonResponse("코스 상세입니다.", courseDetailDtoSchema)
    ),
    404: jsonResponse("코스를 찾을 수 없습니다.", ErrorResponseSchema),
  },
  security: [{ learnerSessionCookie: [] }],
  summary: "코스 상세 조회",
} satisfies AnyRouteConfig

const getCourseDetailHandler: ApiRouteHandler<
  typeof getCourseDetailRouteConfig
> = async (context) => {
  const contentService = context.var.requestContext.contentService

  const { courseId } = context.req.valid("param")
  const result = await contentService.getCourseDetail({
    courseId,
    userId: context.var.activeSession.user.id,
  })

  return context.json(unwrapApiCoreResult(result), 200)
}

export const getCourseDetailRoute = defineApiRoute({
  ...getCourseDetailRouteConfig,
  handler: getCourseDetailHandler,
})
