import { Hono } from "hono"

import type { SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"
import { resolveActiveSession } from "@/routes/route-helpers"

export function createAuthRoute(sessionResolver: SessionResolver): Hono {
  const route = new Hono()

  route.get("/session", async (context) => {
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    return context.json({
      user: sessionResult.session.user,
    })
  })

  return route
}
