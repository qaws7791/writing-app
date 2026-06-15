import { Hono } from "hono"
import { describe, expect, it } from "vitest"

import { readJsonBody } from "@/routes/route-helpers"

describe("API route helpers", () => {
  it("잘못된 JSON 본문 파싱 실패 원인을 err 결과에 포함한다", async () => {
    const app = new Hono()

    app.post("/", async (context) => {
      const result = await readJsonBody(context)

      return context.json({
        errorName:
          result.kind === "err" && result.error instanceof Error
            ? result.error.name
            : null,
        kind: result.kind,
      })
    })

    const response = await app.request("/", {
      body: "{",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    await expect(response.json()).resolves.toEqual({
      errorName: "SyntaxError",
      kind: "err",
    })
  })
})
