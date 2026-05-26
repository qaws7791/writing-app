import { describe, expect, it } from "vitest"

import { ensureDatabaseDirectory, parseApiEnv } from "@/env"

describe("parseApiEnv", () => {
  it("fails fast when required platform secrets are missing", () => {
    expect(() => parseApiEnv({})).toThrow()
  })

  it("uses stable local defaults for optional settings", () => {
    const env = parseApiEnv({
      BETTER_AUTH_SECRET: "test-secret-with-enough-length",
      BETTER_AUTH_URL: "http://localhost:4000",
      DATABASE_URL: "file:data/api.sqlite",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      OPENAI_API_KEY: "openai-api-key",
      OPENAI_MODEL: "gpt-5-mini",
    })

    expect(env).toMatchObject({
      corsOrigins: ["http://localhost:3000", "http://localhost:3001"],
      databasePath: "data/api.sqlite",
      environment: "development",
      logLevel: "info",
      port: 4000,
    })
  })

  it("parses file database URLs", () => {
    const env = parseApiEnv({
      BETTER_AUTH_SECRET: "test-secret-with-enough-length",
      BETTER_AUTH_URL: "http://localhost:4000",
      DATABASE_URL: "file:data/test-api.sqlite",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      OPENAI_API_KEY: "openai-api-key",
      OPENAI_MODEL: "gpt-5-mini",
      PORT: "4100",
    })

    expect(env.databasePath).toBe("data/test-api.sqlite")
    expect(env.port).toBe(4100)
  })

  it("parses required platform backend configuration", () => {
    const env = parseApiEnv({
      BETTER_AUTH_SECRET: "test-secret-with-enough-length",
      BETTER_AUTH_URL: "http://localhost:4000",
      DATABASE_URL: "file:data/test-api.sqlite",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      OPENAI_API_KEY: "openai-api-key",
      OPENAI_MODEL: "gpt-5-mini",
    })

    expect(env).toMatchObject({
      betterAuthSecret: "test-secret-with-enough-length",
      betterAuthUrl: "http://localhost:4000",
      databasePath: "data/test-api.sqlite",
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      openAiApiKey: "openai-api-key",
      openAiModel: "gpt-5-mini",
    })
  })
})

describe("ensureDatabaseDirectory", () => {
  it("skips in-memory and bare filename database paths", () => {
    expect(ensureDatabaseDirectory(":memory:")).toBe(false)
    expect(ensureDatabaseDirectory("api.sqlite")).toBe(false)
  })
})
