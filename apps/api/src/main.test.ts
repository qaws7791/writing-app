import { describe, expect, it, vi } from "vitest"

const { serve } = vi.hoisted(() => ({ serve: vi.fn() }))

vi.mock("bun", async (importOriginal) => ({
  ...(await importOriginal<typeof import("bun")>()),
  serve,
}))

describe("API main module", () => {
  it("factory를 import해도 process와 server를 시작하지 않는다", async () => {
    await import("@/main")

    expect(serve).not.toHaveBeenCalled()
  }, 10_000)

  it("production runtime secret 누락은 server 시작 전에 값 비노출로 거절한다", async () => {
    const module = await import("@/main")
    const secret = "provider-secret-sentinel"

    let thrown: unknown
    try {
      await module.startApiServer({
        ADMIN_ASSET_PUBLIC_BASE_URL: "https://assets.example.com",
        ADMIN_ASSET_S3_ACCESS_KEY: "asset-access-key",
        ADMIN_ASSET_S3_BUCKET: "writing-app-assets",
        ADMIN_ASSET_S3_ENDPOINT: "https://s3.example.com",
        ADMIN_ASSET_S3_REGION: "auto",
        ADMIN_ASSET_S3_SECRET_KEY: "asset-secret-key",
        ADMIN_AUTH_SECRET: "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
        ADMIN_ORIGIN: "https://admin.example.com",
        API_PORT: "4000",
        AUTH_EMAIL_FROM: "Writing App <auth@example.com>",
        CURSOR_SIGNING_SECRET:
          "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB",
        DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
        DELETION_MARKER_S3_ACCESS_KEY: "marker-access-key",
        DELETION_MARKER_S3_BUCKET: "writing-app-deletion-markers",
        DELETION_MARKER_S3_ENDPOINT: "https://private-s3.example.com",
        DELETION_MARKER_S3_REGION: "auto",
        DELETION_MARKER_S3_SECRET_KEY: "marker-secret-key",
        DEPLOYMENT_VERSION: "api@sha256:test",
        GOOGLE_CLIENT_ID: "google-client-id",
        GOOGLE_CLIENT_SECRET: secret,
        LEARNER_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef",
        NODE_ENV: "production",
        OPENAI_API_KEY: undefined,
        RESEND_API_KEY: "resend-api-key",
        WEB_ORIGIN: "https://app.example.com",
      })
    } catch (error) {
      thrown = error
    }

    expect(String(thrown)).toContain("OPENAI_API_KEY")
    expect(String(thrown)).not.toContain(secret)
    expect(serve).not.toHaveBeenCalled()
  })
})
