import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

import { createAdminAnalyticsRepository } from "@/adapters/analytics/admin-analytics-drizzle.repository"
import { createAdminDashboardRepository } from "@/adapters/dashboard/admin-dashboard-drizzle.repository"

describe("통합 API 어드민 dashboard·analytics DB adapter", () => {
  it("비어 있는 read-side에서도 안정적인 snapshot과 page를 반환한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)
      const dashboardRepository = createAdminDashboardRepository(client.db)
      const analyticsRepository = createAdminAnalyticsRepository(client.db)

      await expect(dashboardRepository.readDashboard({ now })).resolves.toEqual(
        {
          metrics: {
            activeCourses: 0,
            activeLessons: 0,
            activeUsersLast7Days: 0,
            completedLessons: 0,
            signupsLast7Days: 0,
            signupsToday: 0,
            totalUsers: 0,
          },
          recentActivities: [],
        }
      )
      await expect(
        analyticsRepository.readAnalytics({ days: 1, now })
      ).resolves.toEqual({
        dailySeries: [{ completions: 0, date: "2026-06-14", signups: 0 }],
        streakBuckets: [
          { count: 0, label: "0일" },
          { count: 0, label: "1-3일" },
          { count: 0, label: "4-7일" },
          { count: 0, label: "8-14일" },
          { count: 0, label: "15일+" },
        ],
        worstLessons: [],
      })
      await expect(
        analyticsRepository.readLessonAnalytics({
          direction: "asc",
          page: 1,
          pageSize: 10,
          query: "",
          sort: "completionRate",
        })
      ).resolves.toEqual({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
      })
    } finally {
      client.close()
    }
  })
})
