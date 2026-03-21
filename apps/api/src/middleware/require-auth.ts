import type { MiddlewareHandler } from "hono"

import type { ApiVariables } from "../app-variables.js"
import { UnauthorizedError } from "../http/unauthorized-error.js"

export const requireAuth: MiddlewareHandler<{
  Variables: ApiVariables
}> = async (context, next) => {
  if (!context.get("userId")) {
    throw new UnauthorizedError("로그인이 필요합니다.")
  }

  await next()
}
