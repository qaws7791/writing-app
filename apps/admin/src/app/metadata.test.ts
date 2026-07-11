import { describe, expect, it } from "vitest"

import { metadata } from "@/app/layout"
import robots from "@/app/robots"

describe("관리자 metadata", () => {
  it("모든 route의 검색 색인과 링크 추적을 차단한다", () => {
    expect(metadata.robots).toMatchObject({ follow: false, index: false })
    expect(robots()).toEqual({
      rules: { disallow: "/", userAgent: "*" },
    })
  })
})
