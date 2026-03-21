import type { Context } from "hono"
import { type toUserId } from "@workspace/core"

import type { ApiVariables } from "../app-variables.js"
import { UnauthorizedError } from "./unauthorized-error.js"

export function currentUserId(
  context: Context<{
    Variables: ApiVariables
  }>
): ReturnType<typeof toUserId> {
  const userId = context.get("userId")

  if (!userId) {
    throw new UnauthorizedError("로그인이 필요합니다.")
  }

  return userId
}
