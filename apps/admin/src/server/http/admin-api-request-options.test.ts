import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  createGeneratedRequestOptionsMock,
  getServerAdminSessionTokenMock,
  readAdminWebOriginMock,
  readServerApiBaseUrlMock,
} = vi.hoisted(() => ({
  createGeneratedRequestOptionsMock: vi.fn(),
  getServerAdminSessionTokenMock: vi.fn(),
  readAdminWebOriginMock: vi.fn(),
  readServerApiBaseUrlMock: vi.fn(),
}))

vi.mock("@workspace/http-client/generated-fetch", () => ({
  createGeneratedRequestOptions: createGeneratedRequestOptionsMock,
}))
vi.mock("@/server/auth/get-admin-session-token", () => ({
  getServerAdminSessionToken: getServerAdminSessionTokenMock,
}))
vi.mock("@/server/env/admin-runtime-config", () => ({
  readAdminWebOrigin: readAdminWebOriginMock,
  readServerApiBaseUrl: readServerApiBaseUrlMock,
}))

import {
  createServerAdminRequestOptions,
  getServerAdminRequestOptions,
} from "@/server/http/admin-api-request-options"

describe("admin generated API server options", () => {
  beforeEach(() => {
    createGeneratedRequestOptionsMock.mockImplementation(
      (_runtime, options) => options
    )
    getServerAdminSessionTokenMock.mockResolvedValue("cookie token")
    readAdminWebOriginMock.mockReturnValue("https://admin.example.test")
    readServerApiBaseUrlMock.mockReturnValue("https://api.example.test")
  })

  it("세션 cookie와 검증된 Origin을 generated runtime에 전달한다", async () => {
    await expect(
      getServerAdminRequestOptions({ cache: "no-store" })
    ).resolves.toMatchObject({ cache: "no-store" })

    const [runtime, options] =
      createGeneratedRequestOptionsMock.mock.calls[0] ?? []
    expect(runtime).toEqual({
      baseUrl: "https://api.example.test",
      cookie: "admin_session_token=cookie%20token",
    })
    expect(new Headers(options?.headers).get("Origin")).toBe(
      "https://admin.example.test"
    )
    expect(options).toMatchObject({ cache: "no-store" })
  })

  it("세션이 없으면 generated request options를 만들지 않는다", async () => {
    getServerAdminSessionTokenMock.mockResolvedValue(null)

    await expect(getServerAdminRequestOptions()).resolves.toBeNull()
    expect(createGeneratedRequestOptionsMock).not.toHaveBeenCalled()
  })

  it("Server Action이 이미 확인한 token으로 cookie를 한 번만 구성할 수 있다", () => {
    createServerAdminRequestOptions("session-token")

    expect(getServerAdminSessionTokenMock).not.toHaveBeenCalled()
    expect(createGeneratedRequestOptionsMock).toHaveBeenCalledOnce()
  })

  it("Orval JSON mutation이 spread할 조건부 header를 plain record로 보존한다", async () => {
    const options = await getServerAdminRequestOptions({
      headers: { "If-Match": '"7"' },
    })

    expect(options?.headers).toEqual({
      "if-match": '"7"',
      origin: "https://admin.example.test",
    })
  })
})
