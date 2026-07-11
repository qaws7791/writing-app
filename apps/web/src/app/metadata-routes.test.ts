import { describe, expect, it } from "vitest"

import manifest from "@/app/manifest"
import robots from "@/app/robots"
import sitemap from "@/app/sitemap"

describe("학습자 metadata route", () => {
  it("sitemap에는 공개 랜딩만 포함한다", () => {
    expect(sitemap()).toEqual([
      expect.objectContaining({ url: "http://localhost:3000" }),
    ])
  })

  it("인증 route의 수집을 차단하고 sitemap을 알린다", () => {
    expect(robots()).toEqual({
      rules: {
        allow: "/",
        disallow: ["/app/", "/login"],
        userAgent: "*",
      },
      sitemap: "http://localhost:3000/sitemap.xml",
    })
  })

  it("설치 가능한 한국어 앱 manifest를 제공한다", () => {
    expect(manifest()).toMatchObject({
      display: "standalone",
      lang: "ko",
      name: "글결",
      start_url: "/",
    })
  })
})
