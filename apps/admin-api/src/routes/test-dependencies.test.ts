import { describe, expect, it } from "vitest"
import type { AdminDashboardDto } from "@workspace/core/admin"
import { localRuntimeDefaults } from "@workspace/env"

import {
  createTestAdminApiDependencies,
  testAdminNow,
  testAdminSession,
} from "@/routes/test-dependencies"

const dashboard: AdminDashboardDto = {
  metrics: {
    activeCourses: 5,
    activeLessons: 44,
    activeUsersLast7Days: 2,
    completedLessons: 3,
    signupsLast7Days: 2,
    signupsToday: 1,
    totalUsers: 3,
  },
  recentActivities: [],
}

describe("어드민 API 테스트 의존성", () => {
  it("기본 관리자 세션과 고정 시간을 제공한다", async () => {
    const dependencies = createTestAdminApiDependencies()

    expect(dependencies.adminOrigin).toBe(localRuntimeDefaults.adminWebOrigin)
    expect(dependencies.now?.()).toEqual(testAdminNow)
    await expect(
      dependencies.sessionResolver.resolveSession("admin-token")
    ).resolves.toEqual(testAdminSession)
    await expect(
      dependencies.sessionResolver.resolveSession("missing-token")
    ).resolves.toBeNull()
  })

  it("테스트에서 필요한 admin service 메서드만 override한다", async () => {
    const dependencies = createTestAdminApiDependencies({
      dashboardService: {
        async getDashboard(input) {
          expect(input).toEqual({ now: testAdminNow })

          return dashboard
        },
      },
    })

    await expect(
      dependencies.dashboardService.getDashboard({ now: testAdminNow })
    ).resolves.toEqual(dashboard)
    await expect(dependencies.dashboardService.getSettings()).rejects.toThrow(
      "Unexpected admin service call: getSettings"
    )
  })
})
