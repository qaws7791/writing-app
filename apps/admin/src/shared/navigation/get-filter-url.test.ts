import { describe, expect, it } from "vitest"

import { createGetFilterHref } from "@/shared/navigation/get-filter-url"

describe("createGetFilterHref", () => {
  it("중립값도 빈 문자열 그대로 query에 보존한다", () => {
    expect(createGetFilterHref([["query", ""]])).toBe("?query=")
  })

  it("override는 같은 이름의 필드 값을 덮어쓴다", () => {
    expect(
      createGetFilterHref([["category", "입문"]], { category: "문법 심화" })
    ).toBe("?category=%EB%AC%B8%EB%B2%95+%EC%8B%AC%ED%99%94")
  })

  it("override에만 있는 이름은 새 query 항목으로 추가한다", () => {
    expect(createGetFilterHref([["status", "all"]], { page: 1 })).toBe(
      "?status=all&page=1"
    )
  })

  it("필드 순서를 유지하고 override 이름의 위치는 바꾸지 않는다", () => {
    expect(
      createGetFilterHref(
        [
          ["status", "all"],
          ["page", 3],
        ],
        { page: 1 }
      )
    ).toBe("?status=all&page=1")
  })

  it("필드와 override가 모두 비어 있으면 빈 query만 남긴다", () => {
    expect(createGetFilterHref([])).toBe("?")
  })
})
