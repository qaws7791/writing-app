import type {
  Env,
  Handler,
  Input,
  MiddlewareHandler,
  TypedResponse,
} from "hono"
import type { OpenAPIRoute, RouteConfig, RouteHandler } from "@hono/zod-openapi"
import type { InternalErrorLogger } from "../errors/error-handler"

export type AnyRouteConfig = RouteConfig & {
  path: string
}

export type DefineRouteConfig<
  R extends AnyRouteConfig = AnyRouteConfig,
  E extends Env = Env,
> = R & {
  handler: LooseRouteHandler<R, E>
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
  errorLogger?: InternalErrorLogger
  middleware?: readonly MiddlewareHandler[]
  routes: TRoutes
}

type LooseHandlerResponse =
  | Promise<Response | TypedResponse<unknown>>
  | Promise<void>
  | Response
  | TypedResponse<unknown>

type LooseRouteHandler<R extends AnyRouteConfig, E extends Env> =
  RouteHandler<R, E> extends Handler<
    infer TEnv extends Env,
    infer TPath extends string,
    infer TInput extends Input,
    infer _TResponse
  >
    ? Handler<TEnv, TPath, TInput, LooseHandlerResponse>
    : never
