import {
  courseDetailDtoSchema,
  courseIdSchema,
  type LearnerContentService,
} from "@workspace/core/content"
import { z } from "@hono/zod-openapi"

import type { SessionResolver } from "@workspace/core/auth"
import { errorResponse } from "@/lib/error-response"
import { createRoute, readValidatedParam } from "@/lib/hono"
import {
  authenticatedResponses,
  errorResponseSchema,
  jsonResponse,
} from "@/lib/openapi-schemas"
import { resolveActiveSession } from "@/routes/route-helpers"

const courseParamsSchema = z.object({
  courseId: courseIdSchema,
})

export type GetCourseDetailRouteDependencies = {
  readonly contentService: LearnerContentService
  readonly sessionResolver: SessionResolver
}

export function createGetCourseDetailRoute({
  contentService,
  sessionResolver,
}: GetCourseDetailRouteDependencies) {
  return createRoute(
    {
      method: "get",
      operationId: "getCourseDetail",
      path: "/{courseId}",
      request: {
        params: courseParamsSchema,
      },
      responses: {
        ...authenticatedResponses(
          jsonResponse("코스 상세입니다.", courseDetailDtoSchema)
        ),
        404: jsonResponse("코스를 찾을 수 없습니다.", errorResponseSchema),
      },
      security: [{ bearerAuth: [] }],
      summary: "코스 상세 조회",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      const { courseId } = readValidatedParam(context, courseParamsSchema)
      const result = await contentService.getCourseDetail({
        courseId,
        userId: sessionResult.session.user.id,
      })

      if (result.kind === "err") {
        return context.json(errorResponse("not_found"), 404)
      }

      return context.json(result.value, 200)
    }
  )
}
