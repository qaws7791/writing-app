import { describe, expect, it, vi } from "vitest"

import { parseApiHostConfiguration } from "@/config/api-hosts"
import { createHostDispatcher } from "@/http/host-dispatcher"

const hosts = parseApiHostConfiguration({
  adminAllowedHosts: "admin-api.example.test,admin-api-unified:4000",
  learnerAllowedHosts: "api.example.test,api:4000",
})

describe("API Host dispatcher", () => {
  it.each([
    ["api.example.test", "learner"],
    ["admin-api.example.test", "admin"],
  ] as const)(
    "%s Host는 %s sub-app 하나만 실행한다",
    async (host, audience) => {
      const learnerFetch = vi.fn(() => new Response("learner"))
      const adminFetch = vi.fn(() => new Response("admin"))
      const dispatch = createHostDispatcher({ adminFetch, hosts, learnerFetch })
      const request = new Request(`http://${host}/courses`, {
        headers: { Host: host },
      })

      await expect(
        Promise.resolve(dispatch(request)).then((response) => response.text())
      ).resolves.toBe(audience)
      expect(
        audience === "learner" ? learnerFetch : adminFetch
      ).toHaveBeenCalledWith(request)
      expect(
        audience === "learner" ? adminFetch : learnerFetch
      ).not.toHaveBeenCalled()
    }
  )

  it.each(["/api/auth/get-session", "/health", "/openapi", "/courses"])(
    "겹치는 %s path도 Host별 sentinel sub-app을 독립 실행한다",
    async (path) => {
      const learnerFetch = vi.fn(() => new Response(`learner:${path}`))
      const adminFetch = vi.fn(() => new Response(`admin:${path}`))
      const dispatch = createHostDispatcher({ adminFetch, hosts, learnerFetch })

      const learnerResponse = await dispatch(
        new Request(`http://api.example.test${path}`, {
          headers: { Host: "api.example.test" },
        })
      )
      const adminResponse = await dispatch(
        new Request(`http://admin-api.example.test${path}`, {
          headers: { Host: "admin-api.example.test" },
        })
      )

      await expect(learnerResponse.text()).resolves.toBe(`learner:${path}`)
      await expect(adminResponse.text()).resolves.toBe(`admin:${path}`)
      expect(learnerFetch).toHaveBeenCalledTimes(1)
      expect(adminFetch).toHaveBeenCalledTimes(1)
    }
  )

  it("선택된 sub-app에 원래 request body와 header를 그대로 전달한다", async () => {
    const learnerFetch = vi.fn(async (request: Request) => {
      return Response.json({
        body: await request.text(),
        marker: request.headers.get("x-test-marker"),
      })
    })
    const dispatch = createHostDispatcher({
      adminFetch: vi.fn(),
      hosts,
      learnerFetch,
    })
    const request = new Request("http://api:4000/courses", {
      body: "payload",
      headers: { Host: "API:04000", "X-Test-Marker": "preserved" },
      method: "POST",
    })

    await expect(
      Promise.resolve(dispatch(request)).then((response) => response.json())
    ).resolves.toEqual({ body: "payload", marker: "preserved" })
    expect(learnerFetch).toHaveBeenCalledWith(request)
  })

  it.each([
    ["missing", new Request("http://api.example.test/courses")],
    [
      "unknown",
      new Request("http://unknown.example.test/courses", {
        headers: { Host: "unknown.example.test" },
      }),
    ],
    [
      "mismatch",
      new Request("http://api.example.test/courses", {
        headers: { Host: "admin-api.example.test" },
      }),
    ],
    [
      "invalid",
      new Request("http://api.example.test/courses", {
        headers: { Host: "*.example.test" },
      }),
    ],
  ] as const)(
    "%s Host는 어느 sub-app도 실행하지 않고 421을 반환한다",
    async (reason, request) => {
      const learnerFetch = vi.fn()
      const adminFetch = vi.fn()
      const onRejectedHost = vi.fn()
      const dispatch = createHostDispatcher({
        adminFetch,
        hosts,
        learnerFetch,
        onRejectedHost,
      })

      const response = await dispatch(request)

      expect(response.status).toBe(421)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        code: "MISDIRECTED_REQUEST",
        message: "요청 대상 Host가 올바르지 않습니다.",
      })
      expect(onRejectedHost).toHaveBeenCalledWith({ reason })
      expect(learnerFetch).not.toHaveBeenCalled()
      expect(adminFetch).not.toHaveBeenCalled()
    }
  )

  it("Origin과 X-Forwarded-Host를 dispatch 근거로 사용하지 않는다", async () => {
    const learnerFetch = vi.fn(() => new Response("learner"))
    const adminFetch = vi.fn(() => new Response("admin"))
    const dispatch = createHostDispatcher({ adminFetch, hosts, learnerFetch })
    const response = await dispatch(
      new Request("http://api.example.test/courses", {
        headers: {
          Host: "api.example.test",
          Origin: "https://admin.example.test",
          "X-Forwarded-Host": "admin-api.example.test",
        },
      })
    )

    await expect(response.text()).resolves.toBe("learner")
    expect(learnerFetch).toHaveBeenCalledTimes(1)
    expect(adminFetch).not.toHaveBeenCalled()
  })

  it("Bun server가 보존한 원본 Host와 Request URL을 같은 audience로 분기한다", async () => {
    const learnerFetch = vi.fn((request: Request) => {
      return Response.json({ requestUrl: request.url })
    })
    const adminFetch = vi.fn()
    const dispatch = createHostDispatcher({ adminFetch, hosts, learnerFetch })
    const server = Bun.serve({
      fetch: dispatch,
      hostname: "127.0.0.1",
      port: 0,
    })

    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/courses`, {
        headers: { Host: "API.EXAMPLE.TEST" },
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        requestUrl: "http://api.example.test/courses",
      })
      expect(learnerFetch).toHaveBeenCalledTimes(1)
      expect(adminFetch).not.toHaveBeenCalled()
    } finally {
      await server.stop(true)
    }
  })

  it("관찰 callback 오류가 fail-closed 응답을 바꾸지 않는다", async () => {
    const dispatch = createHostDispatcher({
      adminFetch: vi.fn(),
      hosts,
      learnerFetch: vi.fn(),
      onRejectedHost() {
        throw new Error("logger failure")
      },
    })

    const response = await dispatch(
      new Request("http://unknown.example.test/", {
        headers: { Host: "unknown.example.test" },
      })
    )

    expect(response.status).toBe(421)
  })
})
