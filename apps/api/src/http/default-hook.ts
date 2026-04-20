import { type Hook } from "@hono/zod-openapi"
import { ValidationError } from "@workspace/core"
import type { Env } from "hono"

export function createDefaultHook<TEnv extends Env = Env>(): Hook<
  unknown,
  TEnv,
  string,
  void
> {
  return (result) => {
    if (result.success) return

    const details = result.error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.map(String).join("."),
    }))

    throw new ValidationError("유효하지 않은 요청입니다.", details)
  }
}
