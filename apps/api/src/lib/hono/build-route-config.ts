import type { MiddlewareHandler } from "hono"
import { timeout } from "hono/timeout"
import { createRoute } from "@hono/zod-openapi"
import type { RouteConfig } from "@hono/zod-openapi"

import { TimeoutError } from "../../http/timeout-error"
import type {
  HttpMethod,
  ResponseDescriptor,
  ResponseMap,
  RouteMeta,
} from "./define-route"
import type { SuccessStatusCode } from "./route-status-response"

const STATUS_DESCRIPTIONS: Record<number, string> = {
  200: "성공",
  201: "생성 완료",
  202: "처리 수락",
  204: "처리 완료",
}

type BuildRouteConfigOptions = {
  meta?: RouteMeta
  method: HttpMethod
  middleware?: MiddlewareHandler[]
  path: string
  request?: {
    body?: unknown
    params?: unknown
    query?: unknown
  }
  response: ResponseMap
  timeoutMs?: number
}

type BuildRouteConfigResult = {
  defaultSuccessStatus: SuccessStatusCode
  route: ReturnType<typeof createRoute>
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
    const status = Number(key)
    if (status >= 200 && status < 300) {
      return status as SuccessStatusCode
    }
  }

  return 200
}

export function buildRouteConfig(
  options: BuildRouteConfigOptions
): BuildRouteConfigResult {
  const { meta, method, middleware, path, request, response, timeoutMs } =
    options

  const defaultSuccessStatus = pickSuccessStatus(response)
  const requestConfig: Record<string, unknown> = {}

  if (request?.body) {
    requestConfig.body = {
      content: { "application/json": { schema: request.body } },
      required: true,
    }
  }
  if (request?.query) requestConfig.query = request.query
  if (request?.params) requestConfig.params = request.params

  const routeMiddleware: MiddlewareHandler[] = []
  if (timeoutMs !== undefined) {
    routeMiddleware.push(
      timeout(timeoutMs, () => {
        throw new TimeoutError()
      })
    )
  }
  if (middleware?.length) {
    routeMiddleware.push(...middleware)
  }

  const route = createRoute({
    method,
    path,
    ...(Object.keys(requestConfig).length > 0 && { request: requestConfig }),
    responses: buildResponses(response),
    ...(routeMiddleware.length > 0 && { middleware: routeMiddleware }),
    ...meta,
  } as RouteConfig)

  return { defaultSuccessStatus, route }
}
