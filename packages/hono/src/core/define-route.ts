import type { Env } from "hono"
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi"
import type { RouteHandler } from "@hono/zod-openapi"
import { assertOpenApiPath } from "./path"
import type { AnyRouteConfig, DefinedRoute, DefineRouteConfig } from "./types"

/**
 * OpenAPI route config와 handler를 하나의 route 단위로 정의한다.
 *
 * 입력은 `@hono/zod-openapi`의 request/response 구조를 그대로 유지한다.
 * 이 함수는 path 문법을 검사하고 handler를 `createRoute()` 결과에 묶는 역할만 한다.
 */
export function defineRoute<const R extends AnyRouteConfig>(
  config: DefineRouteConfig<R>
): DefinedRoute<R>

export function defineRoute<E extends Env>(
  config: DefineRouteConfig<AnyRouteConfig, E>
): DefinedRoute<AnyRouteConfig, E>

export function defineRoute(
  config: AnyRouteConfig & {
    handler: unknown
  }
): DefinedRoute {
  const { handler, ...routeConfig } = config

  assertOpenApiPath(routeConfig.path)

  const route = createRoute(routeConfig)

  return defineOpenAPIRoute({
    route,
    handler: handler as RouteHandler<AnyRouteConfig, Env>,
  } as DefinedRoute)
}

export function defineRouteForEnv<E extends Env>() {
  return function defineEnvRoute<const R extends AnyRouteConfig>(
    config: DefineRouteConfig<R, E>
  ): DefinedRoute<R, E> {
    return defineRoute(config as never) as never
  }
}
