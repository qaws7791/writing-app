import {
  lessonDtoSchema,
  lessonIdSchema,
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

const lessonParamsSchema = z.object({
  lessonId: lessonIdSchema,
})

export type GetLessonRouteDependencies = {
  readonly contentService: LearnerContentService
  readonly sessionResolver: SessionResolver
}

export function createGetLessonRoute({
  contentService,
  sessionResolver,
}: GetLessonRouteDependencies) {
  return createRoute(
    {
      method: "get",
      operationId: "getLesson",
      path: "/{lessonId}",
      request: {
        params: lessonParamsSchema,
      },
      responses: {
        ...authenticatedResponses(
          jsonResponse("레슨 상세입니다.", lessonDtoSchema)
        ),
        404: jsonResponse("레슨을 찾을 수 없습니다.", errorResponseSchema),
      },
      security: [{ bearerAuth: [] }],
      summary: "레슨 상세 조회",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      const { lessonId } = readValidatedParam(context, lessonParamsSchema)
      const result = await contentService.getLesson(lessonId)

      if (result.kind === "err") {
        return context.json(errorResponse("not_found"), 404)
      }

      return context.json(result.value, 200)
    }
  )
}
