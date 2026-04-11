import type { Context, Env, MiddlewareHandler } from "hono"
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

// ── Type Utilities ──

type Vars<TEnv extends Env> = TEnv extends {
  Variables: infer V extends Record<string, unknown>
}
  ? V
  : Record<string, never>

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

type InjectMap = Record<string, InjectionToken<any>>

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

type HandlerReturn<TData> =
  | TData
  | Result<TData, DomainError>
  | PromiseLike<TData | Result<TData, DomainError>>

type RouteMeta = {
  deprecated?: boolean
  description?: string
  security?: Record<string, string[]>[]
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

function resolveHandlerValue(value: unknown): unknown {
  if (!isResult(value)) return value
  if (value.isOk()) return value.value
  const error = value.error
  if (error instanceof Error) throw error
  throw toApplicationError(error as DomainError)
}

function isResponseDescriptor(value: unknown): value is ResponseDescriptor {
  return (
    typeof value === "object" &&
    value !== null &&
    "content" in value &&
    "description" in value
  )
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
 *   meta: { summary: "글 생성", tags: ["글"], security: [{ cookieAuth: [] }] },
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
    } = options

    const successStatus = pickSuccessStatus(response)

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

    const route = createRoute({
      method,
      path,
      ...(hasRequest && { request: reqConfig }),
      responses: buildResponses(response),
      ...(middleware?.length && { middleware }),
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

    app.openapi(route, async (c: any) => {
      const input: Record<string, unknown> = { context: c }

      if (inject) {
        for (const [handlerKey, token] of Object.entries(inject)) {
          input[handlerKey] = c.var[token.key]
        }
      }

      if (request?.body) input.body = c.req.valid("json")
      if (request?.query) input.query = c.req.valid("query")
      if (request?.params) input.params = c.req.valid("param")

      const raw = await handler(
        input as HandlerInput<TEnv, TBody, TQuery, TParams, TInject>
      )
      const data = resolveHandlerValue(raw)

      if (successStatus === 204) return c.body(null, 204)
      return c.json(data, successStatus)
    })

    return app
  }
}
