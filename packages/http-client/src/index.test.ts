import { describe, expect, it } from "vitest"

import { fetchHttpResponse, httpApiFailure, httpApiOk } from "@/index"

describe("HTTP client transport", () => {
  it("fetch 예외를 원인이 보존된 네트워크 오류 값으로 반환한다", async () => {
    const cause = new TypeError("DNS lookup failed")
    const request = new Request(
      "https://api.example.test/courses?query=%EB%B9%84%EB%B0%80",
      {
        method: "POST",
      }
    )

    await expect(
      fetchHttpResponse(request, async () => {
        throw cause
      })
    ).resolves.toEqual({
      error: {
        cause,
        code: "network-error",
        kind: "failed",
        method: "POST",
        url: "https://api.example.test/courses",
      },
      kind: "network-error",
    })
  })

  it("abort 예외는 중단된 네트워크 오류로 분류한다", async () => {
    const request = new Request("https://api.example.test/profile")
    const cause = new DOMException("The operation was aborted.", "AbortError")

    await expect(
      fetchHttpResponse(request, async () => {
        throw cause
      })
    ).resolves.toMatchObject({
      error: {
        cause,
        kind: "aborted",
      },
      kind: "network-error",
    })
  })

  it("fetch 성공은 응답을 그대로 반환한다", async () => {
    const response = Response.json({ ok: true })

    await expect(
      fetchHttpResponse(
        new Request("https://api.example.test/profile"),
        async () => response
      )
    ).resolves.toEqual({
      kind: "ok",
      response,
    })
  })

  it("클라이언트 API result shape를 명시적으로 만든다", () => {
    expect(httpApiOk({ id: "course-1" })).toEqual({
      status: "ok",
      value: {
        id: "course-1",
      },
    })

    expect(httpApiFailure({ code: "contract-error" })).toEqual({
      error: {
        code: "contract-error",
      },
      status: "error",
    })
  })
})
