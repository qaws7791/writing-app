import { cors } from "hono/cors"
import type { MiddlewareHandler } from "hono"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import type { ApiDependencies } from "@/context/create-request-context"
import type { ApiHonoEnv } from "@/context/hono-env"

export function createCorsMiddleware({
  webOrigin,
}: Pick<ApiDependencies, "webOrigin">): MiddlewareHandler<ApiHonoEnv> {
  return cors({
    allowHeaders: ["Authorization", "Content-Type", "Idempotency-Key"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    origin: webOrigin ?? localRuntimeDefaults.learnerWebOrigin,
  })
}
