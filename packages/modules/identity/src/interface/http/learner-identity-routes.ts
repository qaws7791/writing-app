import type { MiddlewareHandler } from "hono"
import { createRoute, type OpenAPIHono } from "@hono/zod-openapi"
import type { HttpPlatformEnv } from "@workspace/http-platform/app"
import { jsonResponse } from "@workspace/http-platform/openapi"
import { AppError } from "@workspace/http-platform/errors"
import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "@workspace/http-platform/security"
import {
  learnerProfileResponseSchema,
  learnerSessionResponseSchema,
  learnerUpdateProfileRequestSchema,
  learnerUpdateProfileResponseSchema,
} from "@workspace/contracts/identity/learner-profile"
import { apiErrorSchema } from "@workspace/contracts/api-error"

import type { LearnerProfileStatsQuery } from "#identity/application/identity-ports"
import type { IdentityApplication } from "#identity/application/identity-service"
import type {
  AuthenticatedSession,
  SessionResolver,
} from "#identity/application/identity-sessions"
import { mapIdentityError } from "#identity/interface/http/identity-http-errors"

export type IdentityLearnerHonoEnv = HttpPlatformEnv<{
  activeSession: AuthenticatedSession
}>

export function registerLearnerIdentityRoutes<
  TEnv extends IdentityLearnerHonoEnv,
>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly application: Pick<IdentityApplication, "changeLearnerDisplayName">
    readonly profileStatsQuery: LearnerProfileStatsQuery
    readonly sessionResolver: SessionResolver
  }
): void {
  const requireActiveSession = createRequireActiveLearnerSessionMiddleware(
    input.sessionResolver
  )
  const routeOptions = {
    middleware: [requireActiveSession],
    security: [{ learnerSessionCookie: [] }],
  }

  const sessionRoute = createRoute({
    method: "get",
    operationId: "getAuthSession",
    path: "/auth/session",
    responses: authenticatedResponses(
      jsonResponse("현재 인증 세션입니다.", learnerSessionResponseSchema)
    ),
    summary: "현재 세션 조회",
    ...routeOptions,
  })
  app.openapi(sessionRoute, (context) =>
    context.json(
      learnerSessionResponseSchema.parse({
        user: context.var.activeSession.user,
      }),
      200
    )
  )

  const profileRoute = createRoute({
    method: "get",
    operationId: "getProfile",
    path: "/profile",
    responses: authenticatedResponses(
      jsonResponse("학습자 프로필과 통계입니다.", learnerProfileResponseSchema)
    ),
    summary: "학습자 프로필 조회",
    ...routeOptions,
  })
  app.openapi(profileRoute, async (context) => {
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
  })

  const updateProfileRoute = createRoute({
    method: "patch",
    operationId: "updateProfile",
    path: "/profile",
    request: {
      body: {
        content: {
          "application/json": { schema: learnerUpdateProfileRequestSchema },
        },
      },
    },
    responses: {
      ...authenticatedResponses(
        jsonResponse(
          "수정된 학습자 프로필입니다.",
          learnerUpdateProfileResponseSchema
        )
      ),
      400: jsonResponse("프로필 입력이 올바르지 않습니다.", apiErrorSchema),
      404: jsonResponse("학습자 프로필을 찾을 수 없습니다.", apiErrorSchema),
      409: jsonResponse("프로필 수정이 충돌했습니다.", apiErrorSchema),
    },
    summary: "학습자 프로필 수정",
    ...routeOptions,
  })
  app.openapi(updateProfileRoute, async (context) => {
    const result = await input.application.changeLearnerDisplayName({
      displayName: context.req.valid("json").name,
      userId: context.var.activeSession.user.id,
    })
    if (result.isErr()) throw mapIdentityError(result.error)

    return context.json(
      learnerUpdateProfileResponseSchema.parse({
        name: result.value.displayName,
      }),
      200
    )
  })
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
    401: jsonResponse("학습자 인증이 필요합니다.", apiErrorSchema),
    403: jsonResponse("활성 계정이 필요합니다.", apiErrorSchema),
  }
}
