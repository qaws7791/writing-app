import type { Hono } from "hono"

import type { AdminApiAppDependencies } from "@/app"

export function registerHealthRoute(
  app: Hono,
  { checkDatabase }: Pick<AdminApiAppDependencies, "checkDatabase">
) {
  app.get("/health", async (context) => {
    const databaseAvailable = await checkDatabase()

    return context.json(
      {
        ok: databaseAvailable,
        service: "admin-api",
      },
      databaseAvailable ? 200 : 503
    )
  })
}
