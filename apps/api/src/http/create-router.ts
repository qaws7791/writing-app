import { OpenAPIHono } from "@hono/zod-openapi"
import { ValidationError } from "@workspace/core"

import type { AppEnv } from "../app-env"

export function createRouter() {
  return new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (result.success) return

      const details = result.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.join("."),
      }))

      throw new ValidationError("유효하지 않은 요청입니다.", details)
    },
  })
}
