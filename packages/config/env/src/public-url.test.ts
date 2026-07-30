import { describe, expect, it } from "vitest"

import {
  assertContentAssetPublicBaseUrlAllowed,
  assertPublicUrlTransport,
  parseContentAssetImageAllowedOrigins,
  parseContentAssetPublicBaseUrl,
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

  it("콘텐츠 asset base URL을 query나 인증 정보가 없는 canonical prefix로 만든다", () => {
    expect(
      parseContentAssetPublicBaseUrl(
        " https://assets.example.test/content/// ",
        {
          description: "content asset base URL",
          nodeEnvironment: "production",
        }
      )?.href
    ).toBe("https://assets.example.test/content")
    expect(
      parseContentAssetPublicBaseUrl(undefined, {
        description: "content asset base URL",
        nodeEnvironment: "production",
      })
    ).toBeNull()
  })

  it.each([
    ["인증 정보", "https://user:secret@assets.example.test/content"],
    ["query", "https://assets.example.test/content?variant=unsafe"],
    ["빈 query", "https://assets.example.test/content?"],
    ["fragment", "https://assets.example.test/content#fragment"],
    ["HTTP 이외 프로토콜", "ftp://assets.example.test/content"],
  ])("%s가 있는 콘텐츠 asset base URL을 거부한다", (_label, value) => {
    expect(() =>
      parseContentAssetPublicBaseUrl(value, {
        description: "content asset base URL",
        nodeEnvironment: "production",
      })
    ).toThrow("content asset base URL is not a safe public base URL")
  })

  it("asset production은 loopback HTTP를 허용하고 공개 HTTP를 거부한다", () => {
    expect(
      parseContentAssetPublicBaseUrl("http://localhost:9000/assets", {
        description: "content asset base URL",
        nodeEnvironment: "production",
      })?.href
    ).toBe("http://localhost:9000/assets")
    expect(() =>
      parseContentAssetPublicBaseUrl("http://assets.example.test/assets", {
        description: "content asset base URL",
        nodeEnvironment: "production",
      })
    ).toThrow("content asset base URL must use HTTPS in production")
    expect(
      parseContentAssetPublicBaseUrl("http://localhost:9000/assets/", {
        description: "content asset base URL",
        nodeEnvironment: "development",
      })?.href
    ).toBe("http://localhost:9000/assets")
  })

  it("이미지 허용 origin 목록은 canonical exact origin만 허용한다", () => {
    expect(
      parseContentAssetImageAllowedOrigins(
        "https://staging-assets.example.test,https://assets.example.test:8443",
        {
          description: "content asset image allowed origins",
          nodeEnvironment: "production",
        }
      ).map((origin) => origin.origin)
    ).toEqual([
      "https://staging-assets.example.test",
      "https://assets.example.test:8443",
    ])
    expect(
      parseContentAssetImageAllowedOrigins("http://localhost:9000", {
        description: "content asset image allowed origins",
        nodeEnvironment: "production",
      }).map((origin) => origin.origin)
    ).toEqual(["http://localhost:9000"])
  })

  it.each([
    ["wildcard", "https://*.example.test", "non-canonical origin"],
    ["공개 HTTP", "http://assets.example.test", "must use HTTPS in production"],
    ["경로", "https://assets.example.test/path", "non-canonical origin"],
    ["후행 슬래시", "https://assets.example.test/", "non-canonical origin"],
    [
      "query",
      "https://assets.example.test?variant=unsafe",
      "non-canonical origin",
    ],
    ["빈 항목", "https://assets.example.test,", "empty origin"],
    [
      "중복 origin",
      "https://assets.example.test,https://assets.example.test",
      "duplicate origin",
    ],
  ])(
    "이미지 허용 origin 목록의 %s를 거부한다",
    (_label, value, expectedMessage) => {
      expect(() =>
        parseContentAssetImageAllowedOrigins(value, {
          description: "content asset image allowed origins",
          nodeEnvironment: "production",
        })
      ).toThrow(expectedMessage)
    }
  )

  it("production asset base URL origin이 이미지 허용 목록에 있어야 한다", () => {
    const allowedOrigins = parseContentAssetImageAllowedOrigins(
      "https://staging-assets.example.test,https://assets.example.test",
      {
        description: "content asset image allowed origins",
        nodeEnvironment: "production",
      }
    )

    expect(() =>
      assertContentAssetPublicBaseUrlAllowed(
        new URL("https://assets.example.test/writing-app"),
        allowedOrigins,
        {
          description: "content asset public base URL",
          nodeEnvironment: "production",
        }
      )
    ).not.toThrow()
    expect(() =>
      assertContentAssetPublicBaseUrlAllowed(
        new URL("https://unknown-assets.example.test/writing-app"),
        allowedOrigins,
        {
          description: "content asset public base URL",
          nodeEnvironment: "production",
        }
      )
    ).toThrow(
      "content asset public base URL origin is not in the image allowlist"
    )
  })

  it("HTTPS public origin에만 insecure request 승격을 적용한다", () => {
    expect(shouldUpgradeInsecureRequests("https://writing.example.test")).toBe(
      true
    )
    expect(shouldUpgradeInsecureRequests("http://localhost:3000")).toBe(false)
  })
})
