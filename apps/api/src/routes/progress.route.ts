import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  learningDatabaseUnavailableErrorDtoSchema,
  progressCourseListDtoSchema,
  userId,
} from "@workspace/core/learning"

import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"
import {
  jsonServiceResult,
  requireUserSession,
  unauthorizedErrorDtoSchema,
} from "@/routes/route-helpers"

const learningStatusCodes = {
  "invalid-content": 500,
  "invalid-request": 400,
  "not-found": 404,
  unavailable: 503,
} as const

export function registerProgressRoute(
  app: Hono,
  {
    auth,
    learningService,
  }: Pick<ApiAppDependencies, "auth" | "learningService">
) {
  app.get(
    "/progress",
    describeRoute({
      responses: {
        200: {
          description: "현재 학습자의 코스 진행 목록입니다.",
          content: {
            "application/json": {
              schema: resolver(progressCourseListDtoSchema),
            },
          },
        },
        401: {
          description: "로그인이 필요합니다.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const sessionResult = await requireUserSession(context, auth)

      if (sessionResult.status !== "ok") {
        return sessionResult.response
      }

      const result = await learningService.listProgress(
        userId(sessionResult.session.user.id)
      )

      return jsonServiceResult(context, result, learningStatusCodes)
    }
  )
}
