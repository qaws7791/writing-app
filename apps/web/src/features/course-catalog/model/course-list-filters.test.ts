import { describe, expect, it } from "vitest"

import { parseCourseListFilters } from "@/features/course-catalog/model/course-list-filters"

describe("코스 목록 URL 필터", () => {
  it("기존 기본값과 유효한 필터를 보존한다", () => {
    expect(parseCourseListFilters({})).toEqual({
      category: "",
      query: "",
      sort: "recommended",
    })
    expect(
      parseCourseListFilters({
        category: "문장",
        query: "기초",
        sort: "title-desc",
      })
    ).toEqual({ category: "문장", query: "기초", sort: "title-desc" })
  })

  it("배열과 알 수 없는 정렬은 기존처럼 기본값으로 정규화한다", () => {
    expect(
      parseCourseListFilters({
        category: ["문장"],
        query: ["기초"],
        sort: "unknown",
      })
    ).toEqual({ category: "", query: "", sort: "recommended" })
  })
})
