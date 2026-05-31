import { describe, expect, it } from "vitest"

import {
  createAdminCourseListPath,
  parseAdminCourseListSearchParams,
} from "@/features/courses/admin-course-list-search-params"

describe("admin-course-list-search-params", () => {
  it("parses valid course list search params", () => {
    expect(
      parseAdminCourseListSearchParams({
        page: "3",
        pageSize: "20",
        query: "  문장  ",
      })
    ).toEqual({
      page: 3,
      pageSize: 20,
      query: "문장",
    })
  })

  it("falls back deterministically for invalid course list search params", () => {
    expect(
      parseAdminCourseListSearchParams({
        page: "0",
        pageSize: "999",
        query: ["  첫 번째  ", "두 번째"],
      })
    ).toEqual({
      page: 1,
      pageSize: 10,
      query: "첫 번째",
    })
  })

  it("creates canonical course list paths", () => {
    expect(
      createAdminCourseListPath({
        page: 2,
        pageSize: 30,
        query: "  문장 구조  ",
      })
    ).toBe(
      "/courses?page=2&pageSize=30&query=%EB%AC%B8%EC%9E%A5+%EA%B5%AC%EC%A1%B0"
    )
  })

  it("omits empty query values from course list paths", () => {
    expect(
      createAdminCourseListPath({
        page: 1,
        pageSize: 10,
        query: "   ",
      })
    ).toBe("/courses?page=1&pageSize=10")
  })
})
