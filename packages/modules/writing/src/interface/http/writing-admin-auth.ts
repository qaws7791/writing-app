import type { MiddlewareHandler } from "hono"
import { AppError } from "@workspace/http-platform/errors"
import type { HttpPlatformEnv } from "@workspace/http-platform/app"
import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "@workspace/http-platform/security"
import type { AdminId } from "@workspace/types/ids"

export type WritingAdminSessionPort = Readonly<{
  resolveAdminId: (headers: Headers) => Promise<AdminId | null>
}>

export type WritingAdminHonoEnv = HttpPlatformEnv<{
  writingAdminId: AdminId
}>

export function writingAdminSessionRouteOptions(
  sessionPort: WritingAdminSessionPort
) {
  return {
    middleware: [createWritingAdminSessionMiddleware(sessionPort)],
    security: [{ adminSessionCookie: [] }],
  }
}

function createWritingAdminSessionMiddleware(
  sessionPort: WritingAdminSessionPort
): MiddlewareHandler<WritingAdminHonoEnv> {
  return async (context, next) => {
    setPrivateNoStoreHeaders(context)
    const adminId = await sessionPort.resolveAdminId(context.req.raw.headers)
    if (adminId === null) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        status: 401,
      })
    }

    context.set("writingAdminId", adminId)
    context.set("requestActor", {
      id: adminId,
      type: "admin",
    })
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}
