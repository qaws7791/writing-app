import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { learnerApiErrorSchema } from "@workspace/contracts/learning/api-error"
import { learnerIdSchema } from "@workspace/contracts/learning/read-data"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { unwrapApiCoreResult } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  decodeLearnerCourseListQuery,
  encodeLearnerCoursePage,
} from "@/http/learner-read-route-mapper"
import {
  courseCategoriesSchema,
  courseDetailDtoSchema,
  courseListDtoSchema,
  courseParamsSchema,
  courseQuerySchema,
} from "@/modules/courses/courses.schemas"

const listCoursesRouteConfig = {
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getCourses",
  path: "/courses",
  request: {
    query: courseQuerySchema,
  },
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
  const cursorCodec = context.var.requestContext.learnerCursorCodec
  const query = unwrapApiCoreResult(
    decodeLearnerCourseListQuery(cursorCodec, context.req.valid("query"))
  )
  const page = await contentService.listCourses(query)

  return context.json(
    parseLearnerRouteResponse(
      context,
      "LearnerCourseListResponse",
      courseListDtoSchema,
      encodeLearnerCoursePage(cursorCodec, query, page)
    ),
    200
  )
}

export const listCoursesRoute = defineApiRoute({
  ...listCoursesRouteConfig,
  handler: listCoursesHandler,
})

const listCourseCategoriesRouteConfig = {
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getCourseCategories",
  path: "/course-categories",
  responses: authenticatedResponses(
    jsonResponse("학습 가능한 코스 분류 목록입니다.", courseCategoriesSchema)
  ),
  security: [{ learnerSessionCookie: [] }],
  summary: "코스 분류 목록 조회",
} satisfies AnyRouteConfig

const listCourseCategoriesHandler: ApiRouteHandler<
  typeof listCourseCategoriesRouteConfig
> = async (context) => {
  const contentService = context.var.requestContext.contentService

  return context.json(
    parseLearnerRouteResponse(
      context,
      "LearnerCourseCategoriesResponse",
      courseCategoriesSchema,
      await contentService.listCourseCategories()
    ),
    200
  )
}

export const listCourseCategoriesRoute = defineApiRoute({
  ...listCourseCategoriesRouteConfig,
  handler: listCourseCategoriesHandler,
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
    404: jsonResponse("코스를 찾을 수 없습니다.", learnerApiErrorSchema),
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
    userId: learnerIdSchema.parse(context.var.activeSession.user.id),
  })

  return context.json(
    parseLearnerRouteResponse(
      context,
      "LearnerCourseDetailResponse",
      courseDetailDtoSchema,
      unwrapApiCoreResult(result)
    ),
    200
  )
}

export const getCourseDetailRoute = defineApiRoute({
  ...getCourseDetailRouteConfig,
  handler: getCourseDetailHandler,
})
