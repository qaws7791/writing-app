import type { MiddlewareHandler } from "hono"
import { defineRouteForEnv } from "@workspace/http-platform/core"
import type { HttpPlatformEnv } from "@workspace/http-platform/context"
import { jsonResponse } from "@workspace/http-platform/openapi"
import { AppError } from "@workspace/http-platform/errors"
import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "@workspace/http-platform/security"
import {
  learnerProfileResponseSchema,
  learnerSessionResponseSchema,
} from "@workspace/contracts/identity/learner-profile"
import { learnerApiErrorSchema } from "@workspace/contracts/learning/api-error"

import type { LearnerProfileStatsQuery } from "#identity/application/identity-ports"
import type {
  AuthenticatedSession,
  SessionResolver,
} from "#identity/application/identity-sessions"

export type IdentityLearnerHonoEnv = HttpPlatformEnv<{
  activeSession: AuthenticatedSession
}>

const defineLearnerIdentityRoute = defineRouteForEnv<IdentityLearnerHonoEnv>()

export function createLearnerIdentityRoutes(input: {
  readonly profileStatsQuery: LearnerProfileStatsQuery
  readonly sessionResolver: SessionResolver
}) {
  const requireActiveSession = createRequireActiveLearnerSessionMiddleware(
    input.sessionResolver
  )
  const routeOptions = {
    middleware: [requireActiveSession],
    security: [{ learnerSessionCookie: [] }],
  }

  return Object.freeze([
    defineLearnerIdentityRoute({
      method: "get",
      operationId: "getAuthSession",
      path: "/auth/session",
      responses: authenticatedResponses(
        jsonResponse("현재 인증 세션입니다.", learnerSessionResponseSchema)
      ),
      summary: "현재 세션 조회",
      handler: (context) =>
        context.json(
          learnerSessionResponseSchema.parse({
            user: context.var.activeSession.user,
          }),
          200
        ),
      ...routeOptions,
    }),
    defineLearnerIdentityRoute({
      method: "get",
      operationId: "getProfile",
      path: "/profile",
      responses: authenticatedResponses(
        jsonResponse(
          "학습자 프로필과 통계입니다.",
          learnerProfileResponseSchema
        )
      ),
      summary: "학습자 프로필 조회",
      handler: async (context) => {
        const stats = await input.profileStatsQuery.readProfileStats(
          context.var.activeSession.user.id
        )
        return context.json(
          learnerProfileResponseSchema.parse({
            stats,
            user: context.var.activeSession.user,
          }),
          200
        )
      },
      ...routeOptions,
    }),
  ])
}

export function createRequireActiveLearnerSessionMiddleware(
  sessionResolver: SessionResolver
): MiddlewareHandler<IdentityLearnerHonoEnv> {
  return async (context, next) => {
    setPrivateNoStoreHeaders(context)
    const session = await sessionResolver.resolveSession(
      context.req.raw.headers
    )
    if (session === null) {
      throw new AppError({
        code: "UNAUTHENTICATED",
        message: "로그인이 필요합니다.",
        status: 401,
      })
    }
    context.set("activeSession", session)
    context.set("requestActor", { id: session.user.id, type: "learner" })
    if (session.user.status !== "active") {
      throw new AppError({
        code: "FORBIDDEN",
        message: "사용할 수 없는 계정입니다.",
        status: 403,
      })
    }

    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

function authenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: jsonResponse("학습자 인증이 필요합니다.", learnerApiErrorSchema),
    403: jsonResponse("활성 계정이 필요합니다.", learnerApiErrorSchema),
  }
}
