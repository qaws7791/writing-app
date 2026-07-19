import { describe, expect, it } from "vitest"

import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"
import { readApiBaseUrl } from "@/shared/config/admin-runtime-config"

const baseUrl = readApiBaseUrl({
  NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/",
})

const unknownSchema = {
  safeParse: (value: unknown) => ({ data: value, success: true as const }),
}
const nullSchema = {
  safeParse: (value: unknown) =>
    value === null
      ? { data: null, success: true as const }
      : { success: false as const },
}
const valueSchema = {
  safeParse: (value: unknown) =>
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof value.value === "number"
      ? { data: { value: value.value }, success: true as const }
      : { success: false as const },
}

describe("관리자 HTTP 전송 계층", () => {
  it.each([
    ["정상 JSON", new Response('{"value":1}'), valueSchema, "ok"],
    ["빈 응답", new Response(null, { status: 204 }), nullSchema, "ok"],
    ["잘못된 JSON", new Response("{"), unknownSchema, "error"],
  ] as const)("%s 응답을 처리한다", async (_name, response, schema, status) => {
    const transport = createAdminHttpTransport({
      baseUrl,
      fetch: async () => response,
      tokenProvider: () => null,
    })

    const result = await transport.requestJson({
      method: "GET",
      path: "/api/admin/test",
      schema,
    })
    expect(result.status).toBe(status)
  })

  it("인증·Origin·본문을 포함하고 다운로드를 읽는다", async () => {
    let request: Request | undefined
    const transport = createAdminHttpTransport({
      baseUrl,
      fetch: async (input) => {
        request = input
        return new Response("# 문서", {
          headers: {
            "Content-Disposition":
              "attachment; filename*=UTF-8''%EB%AC%B8%EC%84%9C.md",
            "Content-Type": "text/markdown; charset=utf-8",
          },
        })
      },
      requestOrigin: "https://admin.example.test/path",
      tokenProvider: () => "비밀 토큰",
    })

    await expect(
      transport.requestDownload({
        contentType: "text/markdown",
        path: "/api/admin/export",
      })
    ).resolves.toEqual({
      status: "ok",
      value: { body: "# 문서", fileName: "문서.md" },
    })
    expect(request?.credentials).toBe("include")
    expect(request?.headers.get("Cookie")).toContain(
      encodeURIComponent("비밀 토큰")
    )
    expect(request?.headers.get("Origin")).toBe("https://admin.example.test")
  })

  it("네트워크 오류 URL의 쿼리와 프래그먼트를 숨긴다", async () => {
    const transport = createAdminHttpTransport({
      baseUrl,
      fetch: async () => {
        throw new Error("연결 실패")
      },
      tokenProvider: () => null,
    })

    const result = await transport.requestJson({
      method: "GET",
      path: "/api/admin/test?token=secret#fragment",
      schema: unknownSchema,
    })

    expect(result).toMatchObject({
      error: { network: { url: "https://api.example.test/api/admin/test" } },
      status: "error",
    })
  })

  it("호출자가 지정한 조건부 요청 헤더를 전달한다", async () => {
    let request: Request | undefined
    const transport = createAdminHttpTransport({
      baseUrl,
      fetch: async (input) => {
        request = input
        return new Response('{"value":1}')
      },
      tokenProvider: () => null,
    })

    await transport.requestJson({
      headers: { "If-Match": '"3"' },
      method: "PUT",
      path: "/api/admin/test",
      schema: valueSchema,
    })

    expect(request?.headers.get("If-Match")).toBe('"3"')
  })

  it.each([
    [
      "parameter 순서와 대소문자",
      "ATTACHMENT; size=12; FILENAME*=utf-8''%EB%AC%B8%EC%84%9C.md",
      "TEXT/MARKDOWN; Charset=UTF-8",
      "문서.md",
    ],
    [
      "잘못된 UTF-8 percent encoding",
      "attachment; filename*=UTF-8''%E0%A4%A",
      "text/markdown",
      null,
    ],
    ["빈 파일명", "attachment; filename*=UTF-8''", "text/markdown", null],
  ] as const)(
    "다운로드 헤더의 %s 계약을 검증한다",
    async (_name, disposition, contentType, fileName) => {
      const transport = createAdminHttpTransport({
        baseUrl,
        fetch: async () =>
          new Response("본문", {
            headers: {
              "Content-Disposition": disposition,
              "Content-Type": contentType,
            },
          }),
        tokenProvider: () => null,
      })

      const result = await transport.requestDownload({
        contentType: "text/markdown",
        path: "/api/admin/export",
      })

      if (fileName === null) {
        expect(result.status).toBe("error")
      } else {
        expect(result).toMatchObject({ status: "ok", value: { fileName } })
      }
    }
  )
})
