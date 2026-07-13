import { describe, expect, it } from "vitest"

import { createGetFilterHref } from "@/features/shared/get-filter-url"

describe("createGetFilterHref", () => {
  it("중립값을 보존하고 변경값과 첫 페이지를 명시적으로 덮어쓴다", () => {
    expect(
      createGetFilterHref(
        [
          ["query", ""],
          ["category", ""],
          ["status", "all"],
          ["page", 3],
        ],
        { category: "문법 심화", page: 1 }
      )
    ).toBe(
      "?query=&category=%EB%AC%B8%EB%B2%95+%EC%8B%AC%ED%99%94&status=all&page=1"
    )
  })
})
