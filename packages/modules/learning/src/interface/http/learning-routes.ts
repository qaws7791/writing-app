import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
import type { MiddlewareHandler } from "hono"

import { apiErrorSchema } from "@workspace/contracts/api-error"
import {
  learnerCompleteStepResponseSchema,
  learnerCourseCategoriesResponseSchema,
  learnerCourseDetailResponseSchema,
  learnerCourseListResponseSchema,
  learnerCourseParamsSchema,
  learnerCourseQuerySchema,
  learnerLessonParamsSchema,
  learnerLessonResponseSchema,
  learnerProgressQuerySchema,
  learnerProgressResponseSchema,
  learnerSaveStepDraftResponseSchema,
  learnerStartLessonResponseSchema,
} from "@workspace/contracts/learning/learner-api"
import {
  completeLearnerStepBodySchema,
  completeLearnerStepParamsSchema,
  saveLearnerStepDraftBodySchema,
  startLearnerLessonBodySchema,
} from "@workspace/contracts/learning/learner-transition"
import type { LearnerId } from "@workspace/types/ids"
import type { HttpPlatformEnv } from "@workspace/http-platform/app"
import {
  AppError,
  assertExhaustiveHttpResult,
} from "@workspace/http-platform/errors"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "@workspace/http-platform/security"

import type { LearningApplication } from "#learning/application/learning-application"
import type { LearnerCursorCodec } from "#learning/infrastructure/persistence/learner-cursor"
import {
  decodeLearnerCourseListQuery,
  decodeLearnerProgressListQuery,
  encodeLearnerCoursePage,
  encodeLearnerProgressPage,
  presentCompleteStepResult,
  unwrapLearningResult,
} from "#learning/interface/http/learning-http-mapper"

export type LearningLearnerSessionPort = Readonly<{
  resolveLearner: (
    headers: Headers
  ) => Promise<
    | Readonly<{ kind: "active"; learnerId: LearnerId }>
    | Readonly<{ kind: "inactive"; learnerId: LearnerId }>
    | null
  >
}>

export type LearningHonoEnv = HttpPlatformEnv<{
  learningLearner: Readonly<{ learnerId: LearnerId }>
}>

export function registerLearningRoutes<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly application: LearningApplication
    readonly cursor: LearnerCursorCodec
    readonly session: LearningLearnerSessionPort
  }
): void {
  const authenticated = {
    middleware: [createRequireLearnerMiddleware(input.session)],
    security: [{ learnerSessionCookie: [] }],
  }

  registerListCoursesRoute(app, input, authenticated)
  registerListCourseCategoriesRoute(app, input, authenticated)
  registerGetCourseDetailRoute(app, input, authenticated)
  registerGetLessonRoute(app, input, authenticated)
  registerProgressRoute(app, input, authenticated)
  registerStartLessonRoute(app, input, authenticated)
  registerSaveStepDraftRoute(app, input, authenticated)
  registerCompleteStepRoute(app, input, authenticated)
}

function registerListCoursesRoute<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: LearningRouteDependencies,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "get",
    operationId: "getCourses",
    path: "/courses",
    request: { query: learnerCourseQuerySchema },
    responses: authenticatedResponses(
      jsonResponse(
        "학습 가능한 코스 목록입니다.",
        learnerCourseListResponseSchema
      ),
      { 400: errorResponse("유효하지 않은 cursor입니다.") }
    ),
    summary: "코스 목록 조회",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const decoded = decodeLearnerCourseListQuery(
      input.cursor,
      context.req.valid("query")
    )
    if (decoded.isErr()) throw invalidCursorError()
    const page = await input.application.readCourseCatalog(decoded.value)
    return context.json(
      learnerCourseListResponseSchema.parse(
        encodeLearnerCoursePage(input.cursor, decoded.value, page)
      ),
      200
    )
  })
}

function registerListCourseCategoriesRoute<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: LearningRouteDependencies,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "get",
    operationId: "getCourseCategories",
    path: "/course-categories",
    responses: authenticatedResponses(
      jsonResponse(
        "학습 가능한 코스 분류 목록입니다.",
        learnerCourseCategoriesResponseSchema
      )
    ),
    summary: "코스 분류 목록 조회",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) =>
    context.json(
      learnerCourseCategoriesResponseSchema.parse(
        await input.application.readCourseCategories()
      ),
      200
    )
  )
}

function registerGetCourseDetailRoute<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: LearningRouteDependencies,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "get",
    operationId: "getCourseDetail",
    path: "/courses/{courseId}",
    request: { params: learnerCourseParamsSchema },
    responses: authenticatedResponses(
      jsonResponse("코스 상세입니다.", learnerCourseDetailResponseSchema),
      { 404: errorResponse("코스를 찾을 수 없습니다.") }
    ),
    summary: "코스 상세 조회",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const result = await input.application.readCourseDetail({
      courseId: context.req.valid("param").courseId,
      learnerId: context.var.learningLearner.learnerId,
    })
    if (result.isErr()) throw mapReadError(result.error.kind)
    return context.json(
      learnerCourseDetailResponseSchema.parse(result.value),
      200
    )
  })
}

function registerGetLessonRoute<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: LearningRouteDependencies,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "get",
    operationId: "getLesson",
    path: "/lessons/{lessonId}",
    request: { params: learnerLessonParamsSchema },
    responses: authenticatedResponses(
      jsonResponse("레슨 상세입니다.", learnerLessonResponseSchema),
      { 404: errorResponse("레슨을 찾을 수 없습니다.") }
    ),
    summary: "레슨 상세 조회",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const result = await input.application.readLesson({
      lessonId: context.req.valid("param").lessonId,
      learnerId: context.var.learningLearner.learnerId,
    })
    if (result.isErr()) throw mapReadError(result.error.kind)
    return context.json(learnerLessonResponseSchema.parse(result.value), 200)
  })
}

function registerProgressRoute<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: LearningRouteDependencies,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "get",
    operationId: "getProgress",
    path: "/progress",
    request: { query: learnerProgressQuerySchema },
    responses: authenticatedResponses(
      jsonResponse(
        "학습자의 코스별 진행 상태입니다.",
        learnerProgressResponseSchema
      ),
      { 400: errorResponse("유효하지 않은 cursor입니다.") }
    ),
    summary: "학습 진행 조회",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const decoded = decodeLearnerProgressListQuery(
      input.cursor,
      context.var.learningLearner.learnerId,
      context.req.valid("query")
    )
    if (decoded.isErr()) throw invalidCursorError()
    const page = await input.application.readLearnerHome(decoded.value)
    return context.json(
      learnerProgressResponseSchema.parse(
        encodeLearnerProgressPage(input.cursor, decoded.value, page)
      ),
      200
    )
  })
}

function registerStartLessonRoute<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: LearningRouteDependencies,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "post",
    operationId: "startLearnerLesson",
    path: "/learning/lessons/{lessonId}/start",
    request: {
      body: {
        content: {
          "application/json": { schema: startLearnerLessonBodySchema },
        },
        required: true,
      },
      params: learnerLessonParamsSchema,
    },
    responses: authenticatedResponses(
      jsonResponse(
        "시작한 레슨의 학습 상태입니다.",
        learnerStartLessonResponseSchema
      ),
      {
        404: errorResponse("레슨을 찾을 수 없습니다."),
        409: errorResponse("커리큘럼 버전이 변경되었습니다."),
      }
    ),
    summary: "레슨 시작",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const result = await input.application.startLesson({
      expectedCurriculumVersionId:
        context.req.valid("json").expectedCurriculumVersionId,
      learnerId: context.var.learningLearner.learnerId,
      lessonId: context.req.valid("param").lessonId,
    })
    return context.json(
      learnerStartLessonResponseSchema.parse(unwrapLearningResult(result)),
      200
    )
  })
}

function registerCompleteStepRoute<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: LearningRouteDependencies,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "post",
    operationId: "completeLearnerStep",
    path: "/learning/lessons/{lessonId}/steps/{stepId}/complete",
    request: {
      body: {
        content: {
          "application/json": { schema: completeLearnerStepBodySchema },
        },
        required: true,
      },
      params: completeLearnerStepParamsSchema,
    },
    responses: authenticatedResponses(
      jsonResponse(
        "단계 완료와 다음 학습 상태입니다.",
        learnerCompleteStepResponseSchema
      ),
      {
        400: errorResponse("잘못된 요청입니다."),
        404: errorResponse("레슨을 찾을 수 없습니다."),
        409: errorResponse("현재 학습 순서와 요청이 다릅니다."),
      }
    ),
    summary: "현재 레슨 단계 완료",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const params = context.req.valid("param")
    const body = context.req.valid("json")
    const command = {
      learnerId: context.var.learningLearner.learnerId,
      lessonId: params.lessonId,
      stepId: params.stepId,
    }
    const result =
      body.kind === "answer"
        ? await input.application.submitStep({
            ...command,
            completion: { kind: "answer", submission: body.answer },
          })
        : await input.application.submitStep({
            ...command,
            completion: { kind: body.kind },
          })
    return context.json(
      learnerCompleteStepResponseSchema.parse(
        presentCompleteStepResult(unwrapLearningResult(result))
      ),
      200
    )
  })
}

function registerSaveStepDraftRoute<TEnv extends LearningHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: LearningRouteDependencies,
  authenticated: AuthenticatedRouteOptions
): void {
  const route = createRoute({
    method: "put",
    operationId: "saveLearnerStepDraft",
    path: "/learning/lessons/{lessonId}/steps/{stepId}/draft",
    request: {
      body: {
        content: {
          "application/json": { schema: saveLearnerStepDraftBodySchema },
        },
        required: true,
      },
      params: completeLearnerStepParamsSchema,
    },
    responses: authenticatedResponses(
      jsonResponse(
        "저장된 단계 초안과 새 version입니다.",
        learnerSaveStepDraftResponseSchema
      ),
      {
        400: errorResponse("잘못된 초안 요청입니다."),
        404: errorResponse("레슨을 찾을 수 없습니다."),
        409: errorResponse("초안 또는 커리큘럼 version이 충돌했습니다."),
      }
    ),
    summary: "현재 레슨 단계 초안 저장",
    ...authenticated,
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const params = context.req.valid("param")
    const body = context.req.valid("json")
    const result = await input.application.saveStepDraft({
      answer: body.answer,
      expectedCurriculumVersionId: body.expectedCurriculumVersionId,
      expectedVersion: body.expectedVersion,
      learnerId: context.var.learningLearner.learnerId,
      lessonId: params.lessonId,
      stepId: params.stepId,
    })
    return context.json(
      learnerSaveStepDraftResponseSchema.parse(unwrapLearningResult(result)),
      200
    )
  })
}

type LearningRouteDependencies = Readonly<{
  application: LearningApplication
  cursor: LearnerCursorCodec
}>

type AuthenticatedRouteOptions = {
  middleware: MiddlewareHandler<LearningHonoEnv>[]
  security: { learnerSessionCookie: never[] }[]
}

function createRequireLearnerMiddleware(
  session: LearningLearnerSessionPort
): MiddlewareHandler<LearningHonoEnv> {
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
    context.set("learningLearner", { learnerId: learner.learnerId })
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

function authenticatedResponses(
  success: ReturnType<typeof jsonResponse>,
  additional: Readonly<Record<number, ReturnType<typeof jsonResponse>>> = {}
) {
  return {
    200: success,
    401: errorResponse("학습자 인증이 필요합니다."),
    403: errorResponse("활성 계정이 필요합니다."),
    ...additional,
  }
}

function errorResponse(description: string) {
  return jsonResponse(description, apiErrorSchema)
}

function invalidCursorError(): AppError {
  return httpError(400, "INVALID_CURSOR", "cursor가 유효하지 않습니다.")
}

function mapReadError(
  kind: "course-not-found" | "lesson-locked" | "lesson-not-found"
): AppError {
  switch (kind) {
    case "course-not-found":
      return httpError(404, "COURSE_NOT_FOUND", "코스를 찾을 수 없습니다.")
    case "lesson-not-found":
      return httpError(404, "LESSON_NOT_FOUND", "레슨을 찾을 수 없습니다.")
    case "lesson-locked":
      return httpError(403, "LESSON_LOCKED", "아직 학습할 수 없는 레슨입니다.")
  }

  return assertExhaustiveHttpResult(kind)
}

function httpError(
  status: 400 | 401 | 403 | 404,
  code: string,
  message: string
): AppError {
  return new AppError({ code, message, status })
}
