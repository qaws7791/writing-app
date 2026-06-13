import { describe, expect, it } from "vitest"

import { createApp, type AdminApiDependencies } from "@/app"
import type { AdminDashboardDto } from "@workspace/core/admin"

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
  recentActivities: [
    {
      currentStreakDays: 3,
      email: "learner@example.com",
      lastActiveDate: "2026-06-14",
      name: "학습자",
      userId: "user-1",
    },
  ],
}

describe("어드민 API dashboard route", () => {
  it("관리자 세션이 없으면 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/dashboard")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
      },
    })
  })

  it("관리자 세션이 있으면 dashboard 지표를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/dashboard", {
      headers: {
        Authorization: "Bearer admin-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(dashboard)
  })
})

function createDependencies(): AdminApiDependencies {
  return {
    adminOrigin: "http://localhost:3003",
    dashboardService: {
      async getDashboard() {
        return dashboard
      },
    },
    sessionResolver: {
      async resolveSession(token) {
        if (token !== "admin-token") {
          return null
        }

        return {
          admin: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
            role: "owner",
          },
        }
      },
    },
  }
}
