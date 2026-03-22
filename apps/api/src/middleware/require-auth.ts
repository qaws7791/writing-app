import type { MiddlewareHandler } from "hono"

import type { AppEnv } from "../app-env"
import { UnauthorizedError } from "../http/unauthorized-error"

export const requireAuth: MiddlewareHandler<AppEnv> = async (context, next) => {
  if (!context.get("userId")) {
    throw new UnauthorizedError("로그인이 필요합니다.")
  }

  await next()
}
