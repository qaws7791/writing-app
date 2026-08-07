import { describe, expect, it } from "vitest"

import { createGetFilterHref } from "@/shared/navigation/get-filter-url"

describe("createGetFilterHref", () => {
  it("기존 query를 보존하면서 값을 덮어쓰고 새 항목을 추가한다", () => {
    expect(
      readFilterValues(
        createGetFilterHref(
          [
            ["category", "입문"],
            ["query", ""],
            ["status", "all"],
          ],
          { category: "문법 심화", page: 1 }
        )
      )
    ).toEqual({ category: "문법 심화", page: "1", query: "", status: "all" })
  })
})

function readFilterValues(href: string): Readonly<Record<string, string>> {
  return Object.fromEntries(new URLSearchParams(href))
}
