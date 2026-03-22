import type { Context } from "hono"
import type { UserId } from "@workspace/core"

import type { AppEnv } from "../app-env"
import { UnauthorizedError } from "./unauthorized-error"

export function requireUserId(context: Context<AppEnv>): UserId {
  const userId = context.get("userId")

  if (!userId) {
    throw new UnauthorizedError("로그인이 필요합니다.")
  }

  return userId
}
