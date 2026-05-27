import { describe, expect, it } from "vitest"

import { parseAdminApiEnv } from "@/env"

describe("parseAdminApiEnv", () => {
  it("parses admin api environment", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_BETTER_AUTH_SECRET: "admin-secret",
        ADMIN_BETTER_AUTH_URL: "http://localhost:4001",
        ADMIN_CORS_ORIGIN: "http://localhost:3001",
        DATABASE_URL: "file:data/api.sqlite",
      })
    ).toEqual({
      betterAuthSecret: "admin-secret",
      betterAuthUrl: "http://localhost:4001",
      corsOrigins: ["http://localhost:3001"],
      databasePath: "data/api.sqlite",
      environment: "development",
      logLevel: "info",
      port: 4001,
    })
  })
})
