import type { Hono } from "hono"

import type { AdminApiAppDependencies } from "@/app"

export function registerHealthRoute(
  app: Hono,
  {
    checkDatabase,
    logger,
  }: Pick<AdminApiAppDependencies, "checkDatabase" | "logger">
) {
  app.get("/health", async (context) => {
    let databaseAvailable = false

    try {
      databaseAvailable = await checkDatabase()
    } catch (error) {
      logger.error({ error }, "Admin database health check failed")
    }

    return context.json(
      {
        ok: databaseAvailable,
        service: "admin-api",
      },
      databaseAvailable ? 200 : 503
    )
  })
}
