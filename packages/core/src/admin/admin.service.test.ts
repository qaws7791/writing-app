import { describe, expect, it } from "vitest"

import type {
  AdminDashboardDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "@/admin/admin.dto"
import type { AdminRepository } from "@/admin/admin.repository"
import { createAdminService } from "@/admin/admin.service"

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

const userList: AdminUserListDto = {
  items: [
    {
      email: "learner@example.com",
      id: "user-1",
      joined: "2026-06-01",
      lastActive: "2026-06-14",
      lessonsDone: 3,
      name: "학습자",
      status: "active",
      streak: 2,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1,
  },
}

const userDetail: AdminUserDetailDto = {
  email: "learner@example.com",
  id: "user-1",
  joined: "2026-06-01",
  lastActive: "2026-06-14",
  lessonsDone: 3,
  name: "학습자",
  progressPercent: 30,
  status: "active",
  streak: 2,
  totalLessons: 10,
}

describe("어드민 서비스", () => {
  it("repository 대시보드 스냅샷을 관리자 dashboard DTO로 반환한다", async () => {
    const repository: AdminRepository = createRepository()
    const service = createAdminService(repository)

    await expect(
      service.getDashboard({
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual(dashboard)
  })

  it("repository 사용자 목록과 상세, 상태 변경, 삭제 결과를 관리자 DTO로 반환한다", async () => {
    const repository: AdminRepository = createRepository()
    const service = createAdminService(repository)

    await expect(
      service.getUsers({
        page: 1,
        pageSize: 20,
        query: "학습",
        sort: "lastActive",
        status: "all",
      })
    ).resolves.toEqual(userList)
    await expect(service.getUser({ userId: "user-1" })).resolves.toEqual(
      userDetail
    )
    await expect(
      service.updateUserStatus({
        now: new Date("2026-06-14T03:00:00.000Z"),
        status: "suspended",
        userId: "user-1",
      })
    ).resolves.toEqual({
      ...userDetail,
      status: "suspended",
    })
    await expect(
      service.deleteUser({
        now: new Date("2026-06-14T03:00:00.000Z"),
        userId: "user-1",
      })
    ).resolves.toEqual({ deleted: true })
  })
})

function createRepository(): AdminRepository {
  return {
    async deleteUser(input) {
      expect(input.userId).toBe("user-1")
      return { deleted: true }
    },
    async readDashboard(input) {
      expect(input.now.toISOString()).toBe("2026-06-14T03:00:00.000Z")
      return dashboard
    },
    async readUser(input) {
      expect(input.userId).toBe("user-1")
      return userDetail
    },
    async readUsers(input) {
      expect(input).toEqual({
        page: 1,
        pageSize: 20,
        query: "학습",
        sort: "lastActive",
        status: "all",
      })
      return userList
    },
    async updateUserStatus(input) {
      expect(input.status).toBe("suspended")
      return {
        ...userDetail,
        status: "suspended",
      }
    },
  }
}
