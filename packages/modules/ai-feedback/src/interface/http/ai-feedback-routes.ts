import type { RouteHandler } from "@hono/zod-openapi"
import type {
  Env,
  Handler,
  Input,
  MiddlewareHandler,
  TypedResponse,
} from "hono"
import type { Result } from "@workspace/kernel/result"
import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"
import {
  defineRouteForEnv,
  type AnyRouteConfig,
} from "@workspace/http-platform/core"
import type { HttpPlatformEnv } from "@workspace/http-platform/context"
import {
  AppError,
  assertExhaustiveHttpResult,
} from "@workspace/http-platform/errors"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "@workspace/http-platform/security"
import {
  createAiFeedbackHeadersSchema,
  createAiFeedbackParamsSchema,
} from "@workspace/contracts/ai-feedback/feedback"
import { learnerApiErrorSchema } from "@workspace/contracts/learning/api-error"
import { learnerAiFeedbackTransitionResponseSchema } from "@workspace/contracts/learning/learner-api"
import type { LearnerAiFeedbackTransitionResult } from "@workspace/contracts/learning/learner-transition"

export type AiFeedbackHttpRouteGroup = readonly {
  readonly handler: unknown
  readonly route: AnyRouteConfig
}[]

export type AiFeedbackHttpCommand = Readonly<{
  idempotencyKey: string
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
}>

export type AiFeedbackHttpCommandError =
  | Readonly<{ kind: "invalid-request" }>
  | Readonly<{ kind: "lesson-not-found" }>
  | Readonly<{ kind: "lesson-locked" }>
  | Readonly<{ kind: "curriculum-version-changed" }>
  | Readonly<{ kind: "step-sequence-conflict" }>
  | Readonly<{ kind: "feedback-answer-not-found" }>
  | Readonly<{ kind: "feedback-target-invalid" }>
  | Readonly<{
      kind: "attempt-limit-exceeded"
      remainingAttempts: 0
    }>
  | Readonly<{
      kind: "attempt-in-progress"
      remainingAttempts: number
      retryAfterSeconds: number
    }>
  | Readonly<{
      kind:
        | "persistence-failed"
        | "provider-response-invalid"
        | "provider-timeout"
        | "provider-unavailable"
        | "request-aborted"
    }>

export type AiFeedbackHttpCommandPort = Readonly<{
  requestFeedback: (
    command: AiFeedbackHttpCommand,
    options: Readonly<{ signal: AbortSignal }>
  ) => Promise<
    Result<LearnerAiFeedbackTransitionResult, AiFeedbackHttpCommandError>
  >
}>

export type AiFeedbackLearnerSessionPort = Readonly<{
  resolveLearner: (
    headers: Headers
  ) => Promise<
    | Readonly<{ kind: "active"; learnerId: LearnerId }>
    | Readonly<{ kind: "inactive"; learnerId: LearnerId }>
    | null
  >
}>

type AiFeedbackHonoEnv = HttpPlatformEnv<{
  aiFeedbackLearner: Readonly<{ learnerId: LearnerId }>
}>

const defineAiFeedbackRoute = defineRouteForEnv<AiFeedbackHonoEnv>()

export function createAiFeedbackRoutes(input: {
  readonly command: AiFeedbackHttpCommandPort
  readonly session: AiFeedbackLearnerSessionPort
}): AiFeedbackHttpRouteGroup {
  const routeConfig = {
    method: "post",
    middleware: [createRequireLearnerMiddleware(input.session)],
    operationId: "createLearnerStepAiFeedback",
    path: "/learning/lessons/{lessonId}/steps/{stepId}/ai-feedback",
    request: {
      headers: createAiFeedbackHeadersSchema,
      params: createAiFeedbackParamsSchema,
    },
    responses: {
      200: jsonResponse(
        "AI 코칭 결과와 다음 학습 상태입니다.",
        learnerAiFeedbackTransitionResponseSchema
      ),
      400: errorResponse("잘못된 요청입니다."),
      401: errorResponse("학습자 인증이 필요합니다."),
      403: errorResponse("활성 계정이 필요합니다."),
      404: errorResponse("레슨을 찾을 수 없습니다."),
      409: errorResponse("AI 코칭 요청 상태가 충돌합니다."),
      429: errorResponse("AI 코칭 시도 횟수를 모두 사용했습니다."),
      500: errorResponse("AI 코칭 요청을 완료하지 못했습니다."),
      503: errorResponse("AI provider를 사용할 수 없습니다."),
    },
    security: [{ learnerSessionCookie: [] }],
    summary: "현재 AI 코칭 단계 완료",
  } satisfies AnyRouteConfig

  const handler: AiFeedbackRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const params = context.req.valid("param")
    const headers = context.req.valid("header")
    const result = await input.command.requestFeedback(
      {
        idempotencyKey: headers["idempotency-key"],
        learnerId: context.var.aiFeedbackLearner.learnerId,
        lessonId: params.lessonId,
        stepId: params.stepId,
      },
      { signal: context.req.raw.signal }
    )

    if (result.isErr()) return mapAiFeedbackHttpError(result.error)
    return context.json(
      learnerAiFeedbackTransitionResponseSchema.parse(result.value),
      200
    )
  }

  return Object.freeze([
    defineAiFeedbackRoute({
      ...routeConfig,
      handler,
    }),
  ])
}

type AiFeedbackRouteHandler<TRoute extends AnyRouteConfig> =
  RouteHandler<TRoute, AiFeedbackHonoEnv> extends Handler<
    infer TEnv extends Env,
    infer TPath extends string,
    infer TInput extends Input,
    infer _TResponse
  >
    ? Handler<
        TEnv,
        TPath,
        TInput,
        | Promise<Response | TypedResponse<unknown>>
        | Response
        | TypedResponse<unknown>
      >
    : never

function createRequireLearnerMiddleware(
  session: AiFeedbackLearnerSessionPort
): MiddlewareHandler<AiFeedbackHonoEnv> {
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

    context.set("aiFeedbackLearner", { learnerId: learner.learnerId })
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

function mapAiFeedbackHttpError(error: AiFeedbackHttpCommandError): Response {
  switch (error.kind) {
    case "invalid-request":
      throw httpError(400, "VALIDATION_ERROR", "요청 내용을 확인해 주세요.")
    case "lesson-not-found":
      throw httpError(404, "LESSON_NOT_FOUND", "레슨을 찾을 수 없습니다.")
    case "lesson-locked":
      throw httpError(403, "LESSON_LOCKED", "아직 학습할 수 없는 레슨입니다.")
    case "curriculum-version-changed":
      throw httpError(
        409,
        "CURRICULUM_VERSION_CHANGED",
        "학습 콘텐츠 버전이 변경되었습니다."
      )
    case "step-sequence-conflict":
      throw httpError(
        409,
        "STEP_SEQUENCE_CONFLICT",
        "현재 학습 순서와 요청한 단계가 다릅니다."
      )
    case "feedback-answer-not-found":
      throw httpError(
        409,
        "AI_FEEDBACK_ANSWER_NOT_FOUND",
        "코칭할 작성 답변을 찾을 수 없습니다."
      )
    case "feedback-target-invalid":
      throw httpError(
        500,
        "INTERNAL_SERVER_ERROR",
        "AI 코칭 대상 설정이 올바르지 않습니다."
      )
    case "attempt-limit-exceeded":
      throw httpError(
        429,
        "ATTEMPT_LIMIT_EXCEEDED",
        "AI 코칭 시도 횟수를 모두 사용했습니다."
      )
    case "attempt-in-progress":
      return Response.json(
        {
          code: "ATTEMPT_IN_PROGRESS",
          message: "AI 코칭 요청을 처리하고 있습니다.",
        },
        {
          headers: { "Retry-After": String(error.retryAfterSeconds) },
          status: 409,
        }
      )
    case "provider-response-invalid":
    case "provider-timeout":
    case "provider-unavailable":
    case "request-aborted":
      throw httpError(
        503,
        "PROVIDER_UNAVAILABLE",
        "AI 코칭을 잠시 사용할 수 없습니다."
      )
    case "persistence-failed":
      throw httpError(
        500,
        "INTERNAL_SERVER_ERROR",
        "AI 코칭 요청을 완료하지 못했습니다."
      )
  }

  return assertExhaustiveHttpResult(error)
}

function errorResponse(description: string) {
  return jsonResponse(description, learnerApiErrorSchema)
}

function httpError(
  status: 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503,
  code: string,
  message: string
): AppError {
  return new AppError({ code, message, status })
}
