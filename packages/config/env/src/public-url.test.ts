import { describe, expect, it } from "vitest"

import {
  assertPublicUrlTransport,
  shouldUpgradeInsecureRequests,
} from "#env/public-url"

describe("public URL transport", () => {
  it.each([
    "http://localhost:3000",
    "http://tenant.localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ])("production loopback HTTP를 허용한다: %s", (value) => {
    expect(() =>
      assertPublicUrlTransport(new URL(value), {
        description: "web origin",
        nodeEnvironment: "production",
      })
    ).not.toThrow()
  })

  it("production 공개 HTTP와 HTTP 이외 프로토콜을 거부한다", () => {
    expect(() =>
      assertPublicUrlTransport(new URL("http://writing.example.test"), {
        description: "web origin",
        nodeEnvironment: "production",
      })
    ).toThrow(
      "production web origin must use HTTPS unless it targets a loopback host"
    )
    expect(() =>
      assertPublicUrlTransport(new URL("ftp://writing.example.test"), {
        description: "web origin",
        nodeEnvironment: "production",
      })
    ).toThrow(
      "production web origin must use HTTPS unless it targets a loopback host"
    )
  })

  it("development에서는 transport 제한을 적용하지 않는다", () => {
    expect(() =>
      assertPublicUrlTransport(new URL("http://writing.example.test"), {
        description: "web origin",
        nodeEnvironment: "development",
      })
    ).not.toThrow()
  })

  it("HTTPS public origin에만 insecure request 승격을 적용한다", () => {
    expect(shouldUpgradeInsecureRequests("https://writing.example.test")).toBe(
      true
    )
    expect(shouldUpgradeInsecureRequests("http://localhost:3000")).toBe(false)
  })
})
