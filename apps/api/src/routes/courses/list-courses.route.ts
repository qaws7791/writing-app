import {
  courseListDtoSchema,
  type LearnerContentService,
} from "@workspace/core/content"

import type { SessionResolver } from "@workspace/core/auth"
import { errorResponse } from "@/lib/error-response"
import { createRoute } from "@/lib/hono"
import { authenticatedResponses, jsonResponse } from "@/lib/openapi-schemas"
import { resolveActiveSession } from "@/routes/route-helpers"

export type ListCoursesRouteDependencies = {
  readonly contentService: LearnerContentService
  readonly sessionResolver: SessionResolver
}

export function createListCoursesRoute({
  contentService,
  sessionResolver,
}: ListCoursesRouteDependencies) {
  return createRoute(
    {
      method: "get",
      operationId: "getCourses",
      path: "/",
      responses: authenticatedResponses(
        jsonResponse("학습 가능한 코스 목록입니다.", courseListDtoSchema)
      ),
      security: [{ bearerAuth: [] }],
      summary: "코스 목록 조회",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      return context.json(await contentService.listCourses(), 200)
    }
  )
}
