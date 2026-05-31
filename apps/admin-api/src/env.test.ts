import { describe, expect, it } from "vitest"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"

import { ensureDatabaseDirectory, parseAdminApiEnv } from "@/env"

describe("parseAdminApiEnv", () => {
  it("parses admin api environment", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_BETTER_AUTH_SECRET: "admin-secret",
        ADMIN_BETTER_AUTH_URL: "http://localhost:4001",
        ADMIN_CORS_ORIGIN: "http://localhost:3001",
        DATABASE_URL: "file:../../data/api.sqlite",
      })
    ).toEqual({
      betterAuthSecret: "admin-secret",
      betterAuthUrl: "http://localhost:4001",
      cookieDomain: undefined,
      corsOrigins: ["http://localhost:3001"],
      databasePath: "../../data/api.sqlite",
      environment: "development",
      logLevel: "info",
      port: 4001,
    })
  })

  it("parses optional admin Better Auth cookie domain", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_BETTER_AUTH_COOKIE_DOMAIN: "example.com",
        ADMIN_BETTER_AUTH_SECRET: "admin-secret",
        ADMIN_BETTER_AUTH_URL: "https://admin-api.example.com",
        ADMIN_CORS_ORIGIN: "https://admin.example.com",
        DATABASE_URL: "file:../../data/api.sqlite",
      })
    ).toMatchObject({
      betterAuthUrl: "https://admin-api.example.com",
      cookieDomain: "example.com",
      corsOrigins: ["https://admin.example.com"],
    })
  })
})

describe("ensureDatabaseDirectory", () => {
  it("keeps existing parent directories with relative parent segments", () => {
    const databaseDirectory = "../../.tmp-admin-api-existing-data"

    rmSync(databaseDirectory, { force: true, recursive: true })
    mkdirSync(databaseDirectory, { recursive: true })
    writeFileSync(`${databaseDirectory}/api.sqlite`, "")

    try {
      expect(ensureDatabaseDirectory(`${databaseDirectory}/api.sqlite`)).toBe(
        false
      )
    } finally {
      rmSync(databaseDirectory, { force: true, recursive: true })
    }
  })
})
