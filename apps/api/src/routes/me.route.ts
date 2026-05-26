import type { Hono } from "hono"

import type { AuthRuntime } from "@/auth/session"
import { unauthorizedError } from "@/auth/session"

export function registerMeRoute(app: Hono, auth: AuthRuntime) {
  app.get("/me", async (context) => {
    const session = await auth.getSession(context.req.raw.headers)

    if (!session) {
      return context.json(unauthorizedError, 401)
    }

    return context.json(session.user)
  })
}
