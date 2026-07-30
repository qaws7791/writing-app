import { describe, expect, it } from "vitest"

import { parseCourseListFilters } from "@/features/course-catalog/model/course-list-filters"

describe("코스 목록 URL 필터", () => {
  it("문자열 카테고리 필터를 그대로 보존한다", () => {
    expect(parseCourseListFilters({ category: "문장" })).toEqual({
      category: "문장",
    })
  })

  it.each([
    { label: "카테고리가 없는 query", searchParams: {} },
    { label: "반복된 카테고리 query 값", searchParams: { category: ["문장"] } },
  ])("$label은 빈 카테고리 필터로 정규화한다", ({ searchParams }) => {
    expect(parseCourseListFilters(searchParams)).toEqual({ category: "" })
  })
})
