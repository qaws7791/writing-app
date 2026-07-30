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

  it("개발 localhost HTTP origin을 원격 pattern으로 허용한다", () => {
    const developmentOrigins = resolveContentAssetImageAllowedOrigins(
      [],
      parseBaseUrl("http://127.0.0.1:4199/content-assets", "development"),
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
  })

  it.each([
    {
      allowLocal: true,
      expected: true,
      label: "로컬 origin이 허용 목록에 있고 로컬 허용이 켜지면",
      origins: [new URL("http://127.0.0.1:4199")],
    },
    {
      allowLocal: false,
      expected: false,
      label: "로컬 허용이 꺼지면",
      origins: [new URL("http://127.0.0.1:4199")],
    },
    {
      allowLocal: true,
      expected: false,
      label: "공개 origin만 허용 목록에 있으면",
      origins: [new URL("http://assets.example.test")],
    },
  ])(
    "$label 로컬 이미지 허용을 $expected로 판단한다",
    ({ allowLocal, expected, origins }) => {
      expect(shouldAllowLocalContentAssetImages(origins, allowLocal)).toBe(
        expected
      )
    }
  )

  it("로컬 허용이 꺼지면 개발 base URL도 허용 목록에 넣지 않는다", () => {
    expect(
      resolveContentAssetImageAllowedOrigins(
        [],
        parseBaseUrl("http://127.0.0.1:4199/content-assets", "development"),
        false
      )
    ).toEqual([])
  })
})

function parseBaseUrl(value: string, nodeEnvironment: string): URL | null {
  return parseContentAssetPublicBaseUrl(value, {
    description: "content asset public base URL",
    nodeEnvironment,
  })
}
