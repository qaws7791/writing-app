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

  it("배열, 허용되지 않은 정렬과 상한 밖 숫자를 canonical 기본값으로 복구한다", () => {
    expect(
      parseAdminAnalyticsFilters({
        direction: "sideways",
        page: "10001",
        pageSize: "101",
        query: ["문장", "강의"],
        sort: "failureRate",
      })
    ).toEqual({
      direction: "asc",
      page: 1,
      pageSize: 10,
      query: "",
      sort: "completionRate",
    })
  })
})
