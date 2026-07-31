import { describe, expect, it } from "vitest"

import { parseAdminCourseFilters } from "@/features/course-catalog/model/admin-course-filters"

describe("admin course filters", () => {
  it("정상 search parameter를 명시적 조회 조건으로 변환한다", () => {
    expect(
      parseAdminCourseFilters({
        category: "실전 글쓰기",
        page: "2",
        pageSize: "50",
        query: "문장",
        status: "archived",
      })
    ).toEqual({
      category: "실전 글쓰기",
      page: 2,
      pageSize: 50,
      query: "문장",
      status: "archived",
    })
  })

  it.each<{
    readonly expected: number | string
    readonly field: string
    readonly value: string | string[]
  }>([
    { expected: "", field: "category", value: ["실전 글쓰기"] },
    { expected: "", field: "query", value: ["문장"] },
    { expected: 1, field: "page", value: "-1" },
    { expected: 1, field: "page", value: "0" },
    { expected: 20, field: "pageSize", value: "NaN" },
    { expected: "all", field: "status", value: "unknown" },
    { expected: "all", field: "status", value: ["archived"] },
  ])(
    "$field의 $value는 안전한 기본값 $expected로 수렴한다",
    ({ expected, field, value }) => {
      expect(parseAdminCourseFilters({ [field]: value })).toMatchObject({
        [field]: expected,
      })
    }
  )
})
