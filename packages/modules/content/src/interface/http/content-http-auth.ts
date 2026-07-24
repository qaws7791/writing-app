import type { MiddlewareHandler } from "hono"
import { AppError } from "@workspace/http-platform/errors"
import type { HttpPlatformEnv } from "@workspace/http-platform/app"
import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "@workspace/http-platform/security"
import type { AdminId } from "@workspace/types/ids"

import type { ContentAdminSessionPort } from "#content/application/ports/content-ports"

export type ContentAdminHonoEnv = HttpPlatformEnv<{
  contentAdminId: AdminId
}>

export function contentSessionRouteOptions(
  sessionPort: ContentAdminSessionPort
) {
  return {
    middleware: [createContentSessionMiddleware(sessionPort)],
    security: [{ adminSessionCookie: [] }],
  }
}

function createContentSessionMiddleware(
  sessionPort: ContentAdminSessionPort
): MiddlewareHandler<ContentAdminHonoEnv> {
  return async (context, next) => {
    setPrivateNoStoreHeaders(context)
    const adminId = await sessionPort.resolveAdminId(context.req.raw.headers)
    if (adminId === null) throw unauthorizedContentError()

    context.set("contentAdminId", adminId)
    context.set("requestActor", {
      id: adminId,
      type: "admin",
    })
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
