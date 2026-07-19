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

  it("배열, 음수와 알 수 없는 상태는 안전한 기본값으로 수렴한다", () => {
    expect(
      parseAdminCourseFilters({
        category: ["실전 글쓰기"],
        page: "-1",
        pageSize: "NaN",
        query: ["문장"],
        status: "unknown",
      })
    ).toEqual({
      category: "",
      page: 1,
      pageSize: 20,
      query: "",
      status: "all",
    })
  })
})
