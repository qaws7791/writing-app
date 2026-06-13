import { Hono } from "hono"

import type { SessionResolver } from "@/auth/session"
import { createHealthRoute } from "@/routes/health.route"
import { createProfileRoute, type ProfileReader } from "@/routes/profile.route"

export type ApiDependencies = {
  readonly profileReader: ProfileReader
  readonly sessionResolver: SessionResolver
}

export function createApp(dependencies: ApiDependencies): Hono {
  const app = new Hono()

  app.route("/health", createHealthRoute())
  app.route("/profile", createProfileRoute(dependencies))

  return app
}
