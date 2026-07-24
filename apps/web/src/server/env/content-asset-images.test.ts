import { describe, expect, it } from "vitest"
import { parseContentAssetPublicBaseUrl } from "@workspace/env/public-url"
import {
  createContentAssetRemotePatterns,
  readContentAssetImageSource,
  resolveContentAssetImageAllowedOrigins,
  shouldAllowLocalContentAssetImages,
} from "@workspace/nextjs-config/content-asset-images"

describe("콘텐츠 이미지 origin 허용 목록", () => {
  it("설정이 없으면 원격 이미지를 허용하지 않는다", () => {
    expect(createContentAssetRemotePatterns([])).toEqual([])
    expect(readContentAssetImageSource(null)).toBeNull()
  })

  it("승격 대상의 정확한 storage origin만 허용한다", () => {
    expect(
      createContentAssetRemotePatterns([
        new URL("https://staging-assets.example.test"),
        new URL("https://assets.example.test"),
      ])
    ).toEqual([
      {
        hostname: "staging-assets.example.test",
        pathname: "/**",
        port: "",
        protocol: "https",
        search: "",
      },
      {
        hostname: "assets.example.test",
        pathname: "/**",
        port: "",
        protocol: "https",
        search: "",
      },
    ])
    expect(
      readContentAssetImageSource(
        parseBaseUrl("https://assets.example.test/writing-app", "production")
      )
    ).toBe("https://assets.example.test")
  })

  it("개발 localhost HTTP만 허용하고 production HTTP는 거부한다", () => {
    const developmentBaseUrl = parseBaseUrl(
      "http://127.0.0.1:4199/content-assets",
      "development"
    )
    const developmentOrigins = resolveContentAssetImageAllowedOrigins(
      [],
      developmentBaseUrl,
      true
    )
    expect(createContentAssetRemotePatterns(developmentOrigins)).toEqual([
      {
        hostname: "127.0.0.1",
        pathname: "/**",
        port: "4199",
        protocol: "http",
        search: "",
      },
    ])
    expect(shouldAllowLocalContentAssetImages(developmentOrigins, true)).toBe(
      true
    )
    expect(shouldAllowLocalContentAssetImages(developmentOrigins, false)).toBe(
      false
    )
    expect(
      shouldAllowLocalContentAssetImages(
        [new URL("http://assets.example.test")],
        true
      )
    ).toBe(false)
    expect(
      resolveContentAssetImageAllowedOrigins([], developmentBaseUrl, false)
    ).toEqual([])
  })
})

function parseBaseUrl(value: string, nodeEnvironment: string): URL | null {
  return parseContentAssetPublicBaseUrl(value, {
    description: "content asset public base URL",
    nodeEnvironment,
  })
}
