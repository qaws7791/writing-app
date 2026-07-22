import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import {
  createHttpNetworkError,
  requestHttpJson,
} from "#http-client/json-transport"

describe("transport-neutral JSON HTTP client", () => {
  it("success schema를 consumer가 전달한 instance로 실행한다", async () => {
    const schema = z.object({ id: z.string() })
    const safeParse = vi.spyOn(schema, "safeParse")

    await expect(
      requestHttpJson({
        fetch: async () => Response.json({ id: "course-1" }),
        request: new Request("https://api.example.test/courses/1"),
        schema,
      })
    ).resolves.toEqual({
      kind: "success",
      status: 200,
      value: { id: "course-1" },
    })
    expect(safeParse).toHaveBeenCalledOnce()
  })

  it.each([
    [
      "HTTP",
      async () => Response.json({ code: "NOPE" }, { status: 409 }),
      "http-error",
    ],
    ["contract", async () => new Response("not-json"), "contract-error"],
  ] as const)(
    "%s 실패를 별도 variant로 반환한다",
    async (_label, fetch, kind) => {
      await expect(
        requestHttpJson({
          fetch,
          request: new Request("https://api.example.test/courses/1"),
          schema: z.object({ id: z.string() }),
        })
      ).resolves.toMatchObject({ kind })
    }
  )

  it("network cause는 진단 값에만 보존되고 UI message를 만들지 않는다", async () => {
    const cause = new Error("internal socket address")
    const result = await requestHttpJson({
      fetch: async () => {
        throw cause
      },
      request: new Request("https://api.example.test/profile?token=secret"),
      schema: z.unknown(),
    })

    expect(result).toEqual({
      error: {
        code: "network-error",
        cause,
        kind: "failed",
        method: "GET",
        url: "https://api.example.test/profile",
      },
      kind: "network-error",
    })
    expect(JSON.stringify(result)).not.toContain(cause.message)
  })

  it("AbortError를 중단된 network error로 분류한다", () => {
    const cause = new DOMException("aborted", "AbortError")
    expect(
      createHttpNetworkError(
        new Request("https://api.example.test/profile"),
        cause
      )
    ).toMatchObject({ cause, kind: "aborted" })
  })
})
