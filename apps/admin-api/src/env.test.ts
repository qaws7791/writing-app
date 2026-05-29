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
        ADMIN_ASSET_PUBLIC_BASE_URL:
          "http://localhost:9000/writing-app-public-assets",
        ADMIN_ASSET_S3_ACCESS_KEY: "local-access-key",
        ADMIN_ASSET_S3_BUCKET: "writing-app-public-assets",
        ADMIN_ASSET_S3_ENDPOINT: "http://localhost:9000",
        ADMIN_ASSET_S3_REGION: "us-east-1",
        ADMIN_ASSET_S3_SECRET_KEY: "local-secret-key",
        DATABASE_URL: "file:../../data/api.sqlite",
      })
    ).toEqual({
      assetStorage: {
        accessKey: "local-access-key",
        bucket: "writing-app-public-assets",
        endpoint: "http://localhost:9000",
        publicBaseUrl: "http://localhost:9000/writing-app-public-assets",
        region: "us-east-1",
        secretKey: "local-secret-key",
      },
      betterAuthSecret: "admin-secret",
      betterAuthUrl: "http://localhost:4001",
      corsOrigins: ["http://localhost:3001"],
      databasePath: "../../data/api.sqlite",
      environment: "development",
      logLevel: "info",
      port: 4001,
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
