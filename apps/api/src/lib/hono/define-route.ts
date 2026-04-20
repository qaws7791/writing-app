import type { Context, Env, MiddlewareHandler } from "hono"
import { timeout } from "hono/timeout"
import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import type { RouteConfig } from "@hono/zod-openapi"
import type { ZodType, z } from "zod"
import {
  ValidationError,
  toApplicationError,
  type DomainError,
} from "@workspace/core"
import type { Result } from "neverthrow"
import type { InjectionToken } from "../injection-token"
import { TimeoutError } from "../../http/timeout-error"

// ── Type Utilities ──

type HttpMethod = "delete" | "get" | "patch" | "post" | "put"

type SuccessStatusCode = 200 | 201 | 202 | 204

type ResponseDescriptor = {
  readonly content: Record<string, { readonly schema: ZodType }>
  readonly description: string
}

type ResponseMap = {
  [K in SuccessStatusCode]?: ZodType | string
} & {
  default?: ResponseDescriptor
}

type InjectMap = Record<string, InjectionToken<unknown>>

type SuccessData<R extends ResponseMap> = {
  [K in keyof R & SuccessStatusCode]: R[K] extends ZodType
    ? z.infer<R[K]>
    : void
}[keyof R & SuccessStatusCode]

type HandlerInput<
  TEnv extends Env,
  TBody extends ZodType | undefined,
  TQuery extends ZodType | undefined,
  TParams extends ZodType | undefined,
  TInject extends InjectMap,
> = { context: Context<TEnv> } & (TBody extends ZodType
  ? { body: z.infer<TBody> }
  : unknown) &
  (TQuery extends ZodType ? { query: z.infer<TQuery> } : unknown) &
  (TParams extends ZodType ? { params: z.infer<TParams> } : unknown) & {
    [K in keyof TInject]: TInject[K] extends InjectionToken<infer T> ? T : never
  }

/**
 * 핸들러에서 특정 HTTP 상태 코드와 함께 데이터를 반환할 때 사용합니다.
 * 응답에 2xx 상태 코드가 여러 개 정의된 경우(예: 200 / 202) 동적으로 선택할 수 있습니다.
 *
 * @example
 * ```ts
 * handler: async ({ submitStep, ... }) =>
 *   (await submitStep(...)).map((v) =>
 *     withStatus(v.runtime, v.acceptedAi ? 202 : 200)
 *   )
 * ```
 */
export class RouteStatusResponse<TData> {
  readonly __routeStatusBrand = true as const
  constructor(
    readonly data: TData,
    readonly status: SuccessStatusCode
  ) {}
}

export function withStatus<TData>(
  data: TData,
  status: SuccessStatusCode
): RouteStatusResponse<TData> {
  return new RouteStatusResponse(data, status)
}

type HandlerReturn<TData> =
  | TData
  | RouteStatusResponse<TData>
  | Result<TData | RouteStatusResponse<TData>, DomainError>
  | PromiseLike<
      | TData
      | RouteStatusResponse<TData>
      | Result<TData | RouteStatusResponse<TData>, DomainError>
    >

type RouteMeta = {
  deprecated?: boolean
  description?: string
  security?: ReadonlyArray<Record<string, readonly string[]>>
  summary?: string
  tags?: string[]
}

type RouteOptions<
  TEnv extends Env,
  TBody extends ZodType | undefined,
  TQuery extends ZodType | undefined,
  TParams extends ZodType | undefined,
  TInject extends InjectMap,
  TResponse extends ResponseMap,
> = {
  handler: (
    input: HandlerInput<TEnv, TBody, TQuery, TParams, TInject>
  ) => HandlerReturn<SuccessData<TResponse>>
  inject?: TInject
  meta?: RouteMeta
  method: HttpMethod
  middleware?: MiddlewareHandler[]
  path: string
  request?: {
    body?: TBody
    params?: TParams
    query?: TQuery
  }
  response: TResponse
  /**
   * 라우트 단위 타임아웃(ms). 지정하면 전역 타임아웃보다 우선합니다.
   * AI 엔드포인트처럼 오래 걸리는 라우트에서 다른 기본값이 필요할 때 사용하세요.
   */
  timeoutMs?: number
}

// ── Runtime Helpers ──

const STATUS_DESCRIPTIONS: Record<number, string> = {
  200: "성공",
  201: "생성 완료",
  202: "처리 수락",
  204: "처리 완료",
}

function isResult(value: unknown): value is Result<unknown, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "isOk" in value &&
    "isErr" in value &&
    typeof (value as { isOk: unknown }).isOk === "function"
  )
}

function resolveHandlerValue(value: unknown): {
  data: unknown
  status?: SuccessStatusCode
} {
  // Result 처리 — 먼저 언래핑하고 재귀 호출
  if (isResult(value)) {
    if (value.isErr()) {
      const error = value.error
      if (error instanceof Error) throw error
      throw toApplicationError(error as DomainError)
    }
    return resolveHandlerValue(value.value)
  }

  // withStatus() 래퍼 처리
  if (value instanceof RouteStatusResponse) {
    return { data: value.data, status: value.status }
  }

  return { data: value }
}

function isResponseDescriptor(value: unknown): value is ResponseDescriptor {
  return (
    typeof value === "object" &&
    value !== null &&
    "content" in value &&
    "description" in value
  )
}

type ValidatedRequest = {
  valid(target: "json" | "param" | "query"): unknown
}

function buildResponses(response: ResponseMap) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(response)) {
    if (typeof value === "string") {
      out[key] = { description: value }
    } else if (isResponseDescriptor(value)) {
      out[key] = value
    } else if (value != null) {
      out[key] = {
        content: { "application/json": { schema: value } },
        description: STATUS_DESCRIPTIONS[Number(key)] ?? `${key} 응답`,
      }
    }
  }
  return out
}

function pickSuccessStatus(response: ResponseMap): SuccessStatusCode {
  for (const key of Object.keys(response)) {
    const n = Number(key)
    if (n >= 200 && n < 300) return n as SuccessStatusCode
  }
  return 200
}

// ── Factory ──

/**
 * Hono env 타입에 바인딩된 선언적 라우트 정의 함수를 생성합니다.
 *
 * @example
 * ```ts
 * import type { AppEnv } from "../../app-env"
 *
 * const defineRoute = createDefineRoute<AppEnv>()
 *
 * export default defineRoute({
 *   method: "post",
 *   path: "/writings",
 *   inject: { createWriting: "createWritingUseCase" },
 *   request: { body: createWritingBodySchema },
 *   response: { 201: writingDetailSchema, default: defaultErrorResponse },
 *   meta: { summary: "글 생성", tags: ["글"], security: cookieSecurity },
 *   handler: ({ createWriting, body }) => createWriting(body),
 * })
 * ```
 */
export function defineRoute<TEnv extends Env>() {
  return <
    TBody extends ZodType | undefined = undefined,
    TQuery extends ZodType | undefined = undefined,
    TParams extends ZodType | undefined = undefined,
    const TInject extends InjectMap = Record<never, never>,
    const TResponse extends ResponseMap = never,
  >(
    options: RouteOptions<TEnv, TBody, TQuery, TParams, TInject, TResponse>
  ): OpenAPIHono<TEnv> => {
    const {
      handler,
      inject,
      meta,
      method,
      middleware,
      path,
      request,
      response,
      timeoutMs,
    } = options

    const defaultSuccessStatus = pickSuccessStatus(response)

    // Build @hono/zod-openapi request config
    const reqConfig: Record<string, unknown> = {}
    if (request?.body) {
      reqConfig.body = {
        content: { "application/json": { schema: request.body } },
        required: true,
      }
    }
    if (request?.query) reqConfig.query = request.query
    if (request?.params) reqConfig.params = request.params
    const hasRequest = Object.keys(reqConfig).length > 0

    // 라우트 단위 타임아웃 미들웨어를 앞에 붙임 (전역보다 먼저 실행되어 더 짧은 제한 적용)
    const resolvedMiddleware: MiddlewareHandler[] = []
    if (timeoutMs !== undefined) {
      resolvedMiddleware.push(
        timeout(timeoutMs, () => {
          throw new TimeoutError()
        })
      )
    }
    if (middleware?.length) {
      resolvedMiddleware.push(...middleware)
    }

    const route = createRoute({
      method,
      path,
      ...(hasRequest && { request: reqConfig }),
      responses: buildResponses(response),
      ...(resolvedMiddleware.length && { middleware: resolvedMiddleware }),
      ...meta,
    } as RouteConfig)

    const app = new OpenAPIHono<TEnv>({
      defaultHook: (result) => {
        if (result.success) return
        const details = result.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.map(String).join("."),
        }))
        throw new ValidationError("유효하지 않은 요청입니다.", details)
      },
    })

    // Type safety is enforced by defineRoute's generic signature.
    // The internal handler uses a loose context type because @hono/zod-openapi
    // requires exact route-to-handler type correspondence which cannot be
    // expressed when building routes dynamically.

    app.openapi(route, async (c) => {
      const input: Record<string, unknown> = { context: c }
      const contextVariables = c.var as Record<string, unknown>
      const validatedRequest = c.req as ValidatedRequest

      if (inject) {
        for (const [handlerKey, token] of Object.entries(inject)) {
          input[handlerKey] = contextVariables[token.key]
        }
      }

      if (request?.body) input.body = validatedRequest.valid("json")
      if (request?.query) input.query = validatedRequest.valid("query")
      if (request?.params) input.params = validatedRequest.valid("param")

      const raw = await handler(
        input as HandlerInput<TEnv, TBody, TQuery, TParams, TInject>
      )
      const { data, status } = resolveHandlerValue(raw)
      const finalStatus = status ?? defaultSuccessStatus

      if (finalStatus === 204) return c.body(null, 204)
      return c.json(data, finalStatus)
    })

    return app
  }
}
