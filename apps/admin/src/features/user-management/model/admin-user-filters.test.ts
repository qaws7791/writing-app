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

  it("배열, 0과 알 수 없는 정렬은 안전한 기본값으로 수렴한다", () => {
    expect(
      parseAdminUserFilters({
        page: ["2"],
        pageSize: "0",
        query: ["학습자"],
        sort: "unknown",
        status: "unknown",
      })
    ).toEqual({
      page: 1,
      pageSize: 20,
      query: "",
      sort: "lastActive",
      status: "all",
    })
  })
})
