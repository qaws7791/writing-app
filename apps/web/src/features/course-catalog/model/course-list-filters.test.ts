import { describe, expect, it } from "vitest"

import { parseCourseListFilters } from "@/features/course-catalog/model/course-list-filters"

describe("코스 목록 URL 필터", () => {
  it("기존 기본값과 유효한 필터를 보존한다", () => {
    expect(parseCourseListFilters({})).toEqual({
      category: "",
    })
    expect(
      parseCourseListFilters({
        category: "문장",
      })
    ).toEqual({ category: "문장" })
  })

  it("배열 값을 빈 필터로 정규화한다", () => {
    expect(
      parseCourseListFilters({
        category: ["문장"],
      })
    ).toEqual({ category: "" })
  })
})
