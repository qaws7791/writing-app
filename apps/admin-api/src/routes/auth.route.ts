import type { Hono } from "hono"

import type { AdminAuthRuntime } from "@/auth/admin-session"

export function registerAuthRoute(app: Hono, auth: AdminAuthRuntime) {
  app.on(["GET", "POST"], "/api/auth/*", (context) =>
    auth.handler(context.req.raw)
  )
}
