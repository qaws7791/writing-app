import { describe, expect, it } from "vitest"

import { parseAdminAnalyticsFilters } from "@/features/analytics/model/admin-analytics-filters"

describe("parseAdminAnalyticsFilters", () => {
  it("서버 검색·허용 정렬·bounded pagination URL을 파싱한다", () => {
    expect(
      parseAdminAnalyticsFilters({
        direction: "desc",
        page: "4",
        pageSize: "50",
        query: "  문장  ",
        sort: "dropOff",
      })
    ).toEqual({
      direction: "desc",
      page: 4,
      pageSize: 50,
      query: "문장",
      sort: "dropOff",
    })
  })

  it.each<{
    readonly expected: number | string
    readonly field: string
    readonly value: string | string[]
  }>([
    { expected: "desc", field: "direction", value: "sideways" },
    { expected: 1, field: "page", value: "10001" },
    { expected: 1, field: "page", value: "0" },
    { expected: 10, field: "pageSize", value: "101" },
    { expected: "", field: "query", value: ["문장", "강의"] },
    { expected: "dropOff", field: "sort", value: "failureRate" },
  ])(
    "$field의 $value는 canonical 기본값 $expected로 복구한다",
    ({ expected, field, value }) => {
      expect(parseAdminAnalyticsFilters({ [field]: value })).toMatchObject({
        [field]: expected,
      })
    }
  )
})
