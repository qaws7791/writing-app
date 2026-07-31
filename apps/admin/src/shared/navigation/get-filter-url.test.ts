import { describe, expect, it } from "vitest"

import { createGetFilterHref } from "@/shared/navigation/get-filter-url"

describe("createGetFilterHref", () => {
  it("중립값도 빈 문자열 그대로 query에 보존한다", () => {
    expect(readFilterValues(createGetFilterHref([["query", ""]]))).toEqual({
      query: "",
    })
  })

  it("override는 같은 이름의 필드 값을 덮어쓴다", () => {
    expect(
      readFilterValues(
        createGetFilterHref([["category", "입문"]], { category: "문법 심화" })
      )
    ).toEqual({ category: "문법 심화" })
  })

  it("override에만 있는 이름은 새 query 항목으로 추가한다", () => {
    expect(
      readFilterValues(createGetFilterHref([["status", "all"]], { page: 1 }))
    ).toEqual({ page: "1", status: "all" })
  })
})

function readFilterValues(href: string): Readonly<Record<string, string>> {
  return Object.fromEntries(new URLSearchParams(href))
}
