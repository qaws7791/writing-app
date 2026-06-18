import type { Env } from "hono"
import type { OpenAPIRoute, RouteConfig, RouteHandler } from "@hono/zod-openapi"

export type AnyRouteConfig = RouteConfig & {
  path: string
}

export type DefineRouteConfig<
  R extends AnyRouteConfig = AnyRouteConfig,
  E extends Env = Env,
> = R & {
  handler: RouteHandler<R, E>
}

export type DefinedRoute<
  R extends AnyRouteConfig = AnyRouteConfig,
  E extends Env = Env,
> = OpenAPIRoute<R, E, undefined>

type CreateAppRoute = {
  readonly route: RouteConfig
  readonly handler: unknown
}

export type CreateAppOptions<
  TRoutes extends readonly CreateAppRoute[] = readonly CreateAppRoute[],
> = {
  routes: TRoutes
}
