import { describe, expect, it } from "vitest"

import { GET } from "@/app/health/route"

describe("GET /health", () => {
  it("학습자 웹의 liveness를 반환한다", async () => {
    const response = GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "web",
    })
  })
})
