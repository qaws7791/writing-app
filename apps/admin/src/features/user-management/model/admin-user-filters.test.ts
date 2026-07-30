import { describe, expect, it } from "vitest"

import { parseAdminUserFilters } from "@/features/user-management/model/admin-user-filters"

describe("admin user filters", () => {
  it("정상 search parameter를 명시적 조회 조건으로 변환한다", () => {
    expect(
      parseAdminUserFilters({
        page: "3",
        pageSize: "10",
        query: "학습자",
        sort: "streak",
        status: "suspended",
      })
    ).toEqual({
      page: 3,
      pageSize: 10,
      query: "학습자",
      sort: "streak",
      status: "suspended",
    })
  })

  it.each<{
    readonly expected: number | string
    readonly field: string
    readonly value: string | string[]
  }>([
    { expected: 1, field: "page", value: ["2"] },
    { expected: 20, field: "pageSize", value: "0" },
    { expected: "", field: "query", value: ["학습자"] },
    { expected: "lastActive", field: "sort", value: "unknown" },
    { expected: "lastActive", field: "sort", value: ["streak"] },
    { expected: "all", field: "status", value: "unknown" },
  ])(
    "$field의 $value는 안전한 기본값 $expected로 수렴한다",
    ({ expected, field, value }) => {
      expect(parseAdminUserFilters({ [field]: value })).toMatchObject({
        [field]: expected,
      })
    }
  )
})
