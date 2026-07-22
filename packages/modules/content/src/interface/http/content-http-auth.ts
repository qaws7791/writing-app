import type { MiddlewareHandler } from "hono"
import { AppError } from "@workspace/http-platform/errors"
import type { HttpPlatformEnv } from "@workspace/http-platform/context"
import { withPrivateNoStore } from "@workspace/http-platform/security"

import type { ContentAdminSessionPort } from "#content/application/ports/content-ports"
import type { ContentActor } from "#content/domain/content-admin-policy"

export type ContentAdminHonoEnv = HttpPlatformEnv<{
  contentActor: ContentActor
}>

export function contentSessionRouteOptions(
  sessionPort: ContentAdminSessionPort
) {
  return {
    middleware: [createRequireContentSessionMiddleware(sessionPort)],
    security: [{ adminSessionCookie: [] }],
  }
}

export function contentMutationRouteOptions(
  sessionPort: ContentAdminSessionPort
) {
  return {
    middleware: [createRequireContentMutationMiddleware(sessionPort)],
    security: [{ adminSessionCookie: [] }],
  }
}

function createRequireContentSessionMiddleware(
  sessionPort: ContentAdminSessionPort
): MiddlewareHandler<ContentAdminHonoEnv> {
  return async (context, next) => {
    const actor = await sessionPort.resolveActor(context.req.raw.headers)
    if (actor === null) throw unauthorizedContentError()

    context.set("contentActor", actor)
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

function createRequireContentMutationMiddleware(
  sessionPort: ContentAdminSessionPort
): MiddlewareHandler<ContentAdminHonoEnv> {
  return async (context, next) => {
    const actor = await sessionPort.resolveActor(context.req.raw.headers)
    if (actor === null) throw unauthorizedContentError()
    if (actor.mutation === "forbidden") throw forbiddenContentError()

    context.set("contentActor", actor)
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

function unauthorizedContentError(): AppError {
  return new AppError({
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    status: 401,
  })
}

function forbiddenContentError(): AppError {
  return new AppError({
    code: "FORBIDDEN",
    message: "Forbidden",
    status: 403,
  })
}
