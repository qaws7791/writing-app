import { Hono } from "hono"
import { z } from "zod"
import { describe, expect, it } from "vitest"

import { parseJsonBody, readJsonBody } from "@/routes/route-helpers"

describe("API route helpers", () => {
  it("잘못된 JSON 본문 파싱 실패 원인을 err 결과에 포함한다", async () => {
    const app = new Hono()

    app.post("/", async (context) => {
      const result = await readJsonBody(context)

      return context.json({
        errorKind: result.kind === "err" ? result.error.kind : null,
        errorName:
          result.kind === "err" && result.error.cause instanceof Error
            ? result.error.cause.name
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
      errorKind: "malformed-json",
      errorName: "SyntaxError",
      kind: "err",
    })
  })

  it("JSON 본문 형식 검증 실패를 파싱 실패와 분리한다", async () => {
    const app = new Hono()

    app.post("/", async (context) => {
      const result = await parseJsonBody(
        context,
        z.object({
          title: z.string().min(1),
        })
      )

      return context.json({
        errorKind: result.kind === "err" ? result.error.kind : null,
        kind: result.kind,
      })
    })

    const response = await app.request("/", {
      body: JSON.stringify({ title: "" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    await expect(response.json()).resolves.toEqual({
      errorKind: "invalid-body",
      kind: "err",
    })
  })
})
