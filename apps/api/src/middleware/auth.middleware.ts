import type { MiddlewareHandler } from "hono"
import { AppError } from "@workspace/hono/errors"
import { withPrivateNoStore } from "@workspace/hono/security"
import { learnerAccountStatuses } from "@workspace/core/auth"

import type { ApiHonoEnv } from "@/context/hono-env"

export const requireActiveSession: MiddlewareHandler<ApiHonoEnv> = async (
  context,
  next
) => {
  const requestContext = context.var.requestContext
  const session = await requestContext.sessionResolver.resolveSession(
    context.req.raw.headers
  )

  if (session === null) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요합니다.",
      status: 401,
    })
  }

  context.set("activeSession", session)

  if (session.user.status !== learnerAccountStatuses.active) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "사용할 수 없는 계정입니다.",
      status: 403,
    })
  }

  await next()
  context.res = withPrivateNoStore(context.res)
}
