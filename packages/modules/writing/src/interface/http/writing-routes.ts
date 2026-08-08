import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
import type { MiddlewareHandler } from "hono"
import { apiErrorSchema } from "@workspace/contracts/api-error"
import {
  createWritingBodySchema,
  deleteWritingResponseSchema,
  saveWritingBodySchema,
  writingDetailSchema,
  writingListResponseSchema,
  writingParamsSchema,
  writingVersionBodySchema,
} from "@workspace/contracts/writing/writing"
import type { LearnerId } from "@workspace/types/ids"
import type { HttpPlatformEnv } from "@workspace/http-platform/app"
import { AppError } from "@workspace/http-platform/errors"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "@workspace/http-platform/security"

import type { WritingApplication } from "#writing/application/ports/writing-ports"
import {
  presentWriting,
  presentWritingSummary,
  unwrapWritingResult,
} from "#writing/interface/http/writing-http-mapper"

export type WritingLearnerSessionPort = Readonly<{
  resolveLearner: (
    headers: Headers
  ) => Promise<
    | Readonly<{ kind: "active"; learnerId: LearnerId }>
    | Readonly<{ kind: "inactive"; learnerId: LearnerId }>
    | null
  >
}>

export type WritingHonoEnv = HttpPlatformEnv<{
  writingLearner: Readonly<{ learnerId: LearnerId }>
}>

export function registerWritingRoutes<TEnv extends WritingHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly application: WritingApplication
    readonly session: WritingLearnerSessionPort
  }
): void {
  const authenticated = {
    middleware: [createRequireLearnerMiddleware(input.session)],
    security: [{ learnerSessionCookie: [] }],
  }

  registerListWritingsRoute(app, input.application, authenticated)
  registerCreateWritingRoute(app, input.application, authenticated)
  registerGetWritingRoute(app, input.application, authenticated)
  registerSaveWritingRoute(app, input.application, authenticated)
  registerStartSelfCheckRoute(app, input.application, authenticated)
  registerCompleteSelfCheckRoute(app, input.application, authenticated)
  registerDeleteWritingRoute(app, input.application, authenticated)
}

function registerListWritingsRoute<TEnv extends WritingHonoEnv>(
  app: OpenAPIHono<TEnv>,
  application: WritingApplication,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "get",
    operationId: "getWritings",
    path: "/writings",
    responses: authenticatedResponses(
      jsonResponse("저장한 글 목록입니다.", writingListResponseSchema)
    ),
    summary: "글 목록 조회",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const writings = await application.list(
      context.var.writingLearner.learnerId
    )
    return context.json(
      writingListResponseSchema.parse({
        items: writings.map(presentWritingSummary),
      }),
      200
    )
  })
}

function registerCreateWritingRoute<TEnv extends WritingHonoEnv>(
  app: OpenAPIHono<TEnv>,
  application: WritingApplication,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "post",
    operationId: "createWriting",
    path: "/writings",
    request: {
      body: {
        content: {
          "application/json": { schema: createWritingBodySchema },
        },
        required: true,
      },
    },
    responses: {
      201: jsonResponse("새 글입니다.", writingDetailSchema),
      ...authenticationErrorResponses,
    },
    summary: "글 생성",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const writing = await application.create({
      learnerId: context.var.writingLearner.learnerId,
      mode: context.req.valid("json").mode,
    })
    return context.json(writingDetailSchema.parse(presentWriting(writing)), 201)
  })
}

function registerGetWritingRoute<TEnv extends WritingHonoEnv>(
  app: OpenAPIHono<TEnv>,
  application: WritingApplication,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "get",
    operationId: "getWriting",
    path: "/writings/{writingId}",
    request: { params: writingParamsSchema },
    responses: authenticatedResponses(
      jsonResponse("글 상세입니다.", writingDetailSchema),
      { 404: errorResponse("글을 찾을 수 없습니다.") }
    ),
    summary: "글 상세 조회",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const writing = unwrapWritingResult(
      await application.get({
        learnerId: context.var.writingLearner.learnerId,
        writingId: context.req.valid("param").writingId,
      })
    )
    return context.json(writingDetailSchema.parse(presentWriting(writing)), 200)
  })
}

function registerSaveWritingRoute<TEnv extends WritingHonoEnv>(
  app: OpenAPIHono<TEnv>,
  application: WritingApplication,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "put",
    operationId: "saveWriting",
    path: "/writings/{writingId}",
    request: {
      body: {
        content: {
          "application/json": { schema: saveWritingBodySchema },
        },
        required: true,
      },
      params: writingParamsSchema,
    },
    responses: authenticatedResponses(
      jsonResponse("저장한 글과 새 version입니다.", writingDetailSchema),
      {
        404: errorResponse("글을 찾을 수 없습니다."),
        409: errorResponse("글 version이 충돌했습니다."),
      }
    ),
    summary: "글 저장",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const body = context.req.valid("json")
    const writing = unwrapWritingResult(
      await application.save({
        body: body.body,
        expectedVersion: body.expectedVersion,
        learnerId: context.var.writingLearner.learnerId,
        title: body.title,
        writingId: context.req.valid("param").writingId,
      })
    )
    return context.json(writingDetailSchema.parse(presentWriting(writing)), 200)
  })
}

function registerStartSelfCheckRoute<TEnv extends WritingHonoEnv>(
  app: OpenAPIHono<TEnv>,
  application: WritingApplication,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "post",
    operationId: "startWritingSelfCheck",
    path: "/writings/{writingId}/self-check",
    request: writingVersionRequest,
    responses: authenticatedResponses(
      jsonResponse("자기 점검을 시작한 글입니다.", writingDetailSchema),
      {
        404: errorResponse("글을 찾을 수 없습니다."),
        409: errorResponse("글 version이 충돌했습니다."),
      }
    ),
    summary: "자기 점검 시작",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const writing = unwrapWritingResult(
      await application.startSelfCheck({
        expectedVersion: context.req.valid("json").expectedVersion,
        learnerId: context.var.writingLearner.learnerId,
        writingId: context.req.valid("param").writingId,
      })
    )
    return context.json(writingDetailSchema.parse(presentWriting(writing)), 200)
  })
}

function registerCompleteSelfCheckRoute<TEnv extends WritingHonoEnv>(
  app: OpenAPIHono<TEnv>,
  application: WritingApplication,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "post",
    operationId: "completeWritingSelfCheck",
    path: "/writings/{writingId}/self-check/complete",
    request: writingVersionRequest,
    responses: authenticatedResponses(
      jsonResponse("자기 점검을 마친 글입니다.", writingDetailSchema),
      {
        404: errorResponse("글을 찾을 수 없습니다."),
        409: errorResponse("자기 점검 상태가 충돌했습니다."),
      }
    ),
    summary: "자기 점검 완료",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const writing = unwrapWritingResult(
      await application.completeSelfCheck({
        expectedVersion: context.req.valid("json").expectedVersion,
        learnerId: context.var.writingLearner.learnerId,
        writingId: context.req.valid("param").writingId,
      })
    )
    return context.json(writingDetailSchema.parse(presentWriting(writing)), 200)
  })
}

function registerDeleteWritingRoute<TEnv extends WritingHonoEnv>(
  app: OpenAPIHono<TEnv>,
  application: WritingApplication,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "delete",
    operationId: "deleteWriting",
    path: "/writings/{writingId}",
    request: writingVersionRequest,
    responses: authenticatedResponses(
      jsonResponse("글을 삭제했습니다.", deleteWritingResponseSchema),
      {
        404: errorResponse("글을 찾을 수 없습니다."),
        409: errorResponse("글 version이 충돌했습니다."),
      }
    ),
    summary: "글 삭제",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const writingId = unwrapWritingResult(
      await application.delete({
        expectedVersion: context.req.valid("json").expectedVersion,
        learnerId: context.var.writingLearner.learnerId,
        writingId: context.req.valid("param").writingId,
      })
    )
    return context.json(
      deleteWritingResponseSchema.parse({ deleted: true, id: writingId }),
      200
    )
  })
}

const writingVersionRequest = {
  body: {
    content: {
      "application/json": { schema: writingVersionBodySchema },
    },
    required: true,
  },
  params: writingParamsSchema,
} as const

type AuthenticatedRouteOptions = {
  middleware: MiddlewareHandler<WritingHonoEnv>[]
  security: { learnerSessionCookie: never[] }[]
}

function createRequireLearnerMiddleware(
  session: WritingLearnerSessionPort
): MiddlewareHandler<WritingHonoEnv> {
  return async (context, next) => {
    setPrivateNoStoreHeaders(context)
    const learner = await session.resolveLearner(context.req.raw.headers)
    if (learner === null) {
      throw httpError(401, "UNAUTHENTICATED", "로그인이 필요합니다.")
    }
    context.set("requestActor", { id: learner.learnerId, type: "learner" })
    if (learner.kind === "inactive") {
      throw httpError(403, "FORBIDDEN", "사용할 수 없는 계정입니다.")
    }
    context.set("writingLearner", { learnerId: learner.learnerId })
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

const authenticationErrorResponses = {
  401: errorResponse("학습자 인증이 필요합니다."),
  403: errorResponse("활성 계정이 필요합니다."),
}

function authenticatedResponses(
  success: ReturnType<typeof jsonResponse>,
  additional: Readonly<Record<number, ReturnType<typeof jsonResponse>>> = {}
) {
  return {
    200: success,
    ...authenticationErrorResponses,
    ...additional,
  }
}

function errorResponse(description: string) {
  return jsonResponse(description, apiErrorSchema)
}

function httpError(status: 401 | 403, code: string, message: string): AppError {
  return new AppError({ code, message, status })
}
