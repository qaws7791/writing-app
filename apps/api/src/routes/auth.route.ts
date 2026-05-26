import type { Hono } from "hono"

import type { AuthRuntime } from "@/auth/session"

export function registerAuthRoute(app: Hono, auth: AuthRuntime) {
  app.on(["GET", "POST"], "/api/auth/*", (context) =>
    auth.handler(context.req.raw)
  )
}
