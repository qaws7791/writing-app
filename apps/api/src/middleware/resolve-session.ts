import { type MiddlewareHandler } from "hono"
import { toUserId } from "@workspace/core"

import type { ApiVariables, GetSession } from "../app-variables.js"

export function createResolveSessionMiddleware(
  getSession: GetSession
): MiddlewareHandler<{ Variables: ApiVariables }> {
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
    context.set("userId", toUserId(authSession.user.id))
    await next()
  }
}
