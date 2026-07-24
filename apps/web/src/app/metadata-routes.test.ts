import { describe, expect, it } from "vitest"

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
})
