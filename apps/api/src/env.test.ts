import { describe, expect, it } from "vitest"

import { ensureDatabaseDirectory, parseApiEnv } from "@/env"

describe("parseApiEnv", () => {
  it("uses stable local defaults", () => {
    const env = parseApiEnv({})

    expect(env).toEqual({
      corsOrigins: ["http://localhost:3000", "http://localhost:3001"],
      databasePath: "data/api.sqlite",
      environment: "development",
      logLevel: "info",
      port: 4000,
    })
  })

  it("parses file database URLs", () => {
    const env = parseApiEnv({
      DATABASE_URL: "file:data/test-api.sqlite",
      PORT: "4100",
    })

    expect(env.databasePath).toBe("data/test-api.sqlite")
    expect(env.port).toBe(4100)
  })
})

describe("ensureDatabaseDirectory", () => {
  it("skips in-memory and bare filename database paths", () => {
    expect(ensureDatabaseDirectory(":memory:")).toBe(false)
    expect(ensureDatabaseDirectory("api.sqlite")).toBe(false)
  })
})
