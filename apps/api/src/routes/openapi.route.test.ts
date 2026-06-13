import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

describe("플랫폼 API openapi route", () => {
  it("OpenAPI 3.1 baseline document를 반환한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/openapi")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      info: {
        title: "Writing App API",
      },
      openapi: "3.1.0",
      paths: {},
    })
  })
})
