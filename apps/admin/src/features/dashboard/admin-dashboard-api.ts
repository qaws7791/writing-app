import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import {
  adminDashboardDtoSchema,
  type AdminDashboardDto,
} from "@workspace/contracts/admin"

export type AdminDashboard = {
  readonly metrics: {
    readonly activeCourses: number
    readonly activeLessons: number
    readonly activeUsersLast7Days: number
    readonly completedLessons: number
    readonly signupsLast7Days: number
    readonly signupsToday: number
    readonly totalUsers: number
  }
  readonly recentActivities: readonly {
    readonly currentStreakDays: number
    readonly email: string
    readonly lastActiveDate: string | null
    readonly name: string
    readonly userId: string
  }[]
}

export type AdminDashboardApi = {
  readonly getDashboard: () => Promise<AdminApiResult<AdminDashboard>>
}

export function createAdminDashboardApi(
  transport: AdminHttpTransport
): AdminDashboardApi {
  return {
    async getDashboard() {
      const result = await transport.requestJson({
        method: "GET",
        path: "/dashboard",
        schema: adminDashboardDtoSchema,
      })
      return result.status === "error"
        ? result
        : { status: "ok", value: toDashboard(result.value) }
    },
  }
}

function toDashboard(dto: AdminDashboardDto): AdminDashboard {
  return {
    metrics: { ...dto.metrics },
    recentActivities: dto.recentActivities.map((activity) => ({ ...activity })),
  }
}
