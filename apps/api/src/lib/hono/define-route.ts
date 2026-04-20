import type { Context, Env, MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import type { ZodType, z } from "zod"
import type { DomainError } from "@workspace/core/shared"
import type { Result } from "neverthrow"
import type { InjectionToken } from "../injection-token"
import { createOpenApiApp } from "../../http/create-openapi-app"
import { buildHandlerInput } from "./build-handler-input"
import { buildRouteConfig } from "./build-route-config"
import {
  RouteStatusResponse,
  type SuccessStatusCode,
  withStatus,
} from "./route-status-response"
import { resolveHandlerValue } from "./resolve-handler-value"

// ── Type Utilities ──

export type HttpMethod = "delete" | "get" | "patch" | "post" | "put"

export type ResponseDescriptor = {
  readonly content: Record<string, { readonly schema: ZodType }>
  readonly description: string
}

export type ResponseMap = {
  [K in SuccessStatusCode]?: ZodType | string
} & {
  default?: ResponseDescriptor
}

export type InjectMap = Record<string, InjectionToken<unknown>>

type SuccessData<R extends ResponseMap> = {
  [K in keyof R & SuccessStatusCode]: R[K] extends ZodType
    ? z.infer<R[K]>
    : void
}[keyof R & SuccessStatusCode]

export type HandlerInput<
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
  | RouteStatusResponse<TData>
  | Result<TData | RouteStatusResponse<TData>, DomainError>
  | PromiseLike<
      | TData
      | RouteStatusResponse<TData>
      | Result<TData | RouteStatusResponse<TData>, DomainError>
    >

export type RouteMeta = {
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

    const { defaultSuccessStatus, route } = buildRouteConfig({
      meta,
      method,
      middleware,
      path,
      request,
      response,
      timeoutMs,
    })

    const app = createOpenApiApp<TEnv>()

    // Type safety is enforced by defineRoute's generic signature.
    // The internal handler uses a loose context type because @hono/zod-openapi
    // requires exact route-to-handler type correspondence which cannot be
    // expressed when building routes dynamically.

    app.openapi(route, async (c) => {
      const input = buildHandlerInput<TEnv, TBody, TQuery, TParams, TInject>(
        c,
        inject,
        request
      )
      const raw = await handler(input)
      const { data, status } = resolveHandlerValue(raw)
      const finalStatus = status ?? defaultSuccessStatus

      if (finalStatus === 204) return c.body(null, 204)
      return c.json(data, finalStatus)
    })

    return app
  }
}

export { RouteStatusResponse, withStatus }
