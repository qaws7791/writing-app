import type { MiddlewareHandler } from "hono"
import { parseUserId } from "@workspace/core/shared"

import type { AppEnv, GetSession } from "../app-env"

export function createResolveSessionMiddleware(
  getSession: GetSession
): MiddlewareHandler<AppEnv> {
  return async (context, next) => {
    const authSession = await getSession(context.req.raw)

    if (!authSession) {
      context.set("authSession", null)
      context.set("authUser", null)
      context.set("userId", null)
      await next()
      return
    }

    context.set("authSession", authSession.session)
    context.set("authUser", authSession.user)
    context.set("userId", parseUserId(authSession.user.id))
    await next()
  }
}
