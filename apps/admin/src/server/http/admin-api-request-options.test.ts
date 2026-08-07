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

import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"

describe("admin generated API server options", () => {
  beforeEach(() => {
    createGeneratedRequestOptionsMock.mockImplementation(
      (_runtime, options) => options
    )
    getServerAdminSessionTokenMock.mockResolvedValue("cookie token")
    readAdminWebOriginMock.mockReturnValue("https://admin.example.test")
    readServerApiBaseUrlMock.mockReturnValue("https://api.example.test")
  })

  it("세션이 없으면 generated request options를 만들지 않는다", async () => {
    getServerAdminSessionTokenMock.mockResolvedValue(null)

    await expect(getServerAdminRequestOptions()).resolves.toBeNull()
    expect(createGeneratedRequestOptionsMock).not.toHaveBeenCalled()
  })
})
