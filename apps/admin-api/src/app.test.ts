import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminAnalyticsDto,
  AdminDashboardDto,
  AdminLessonAnalyticsPageDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "@workspace/core/admin"

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
    pageSize: 12,
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

const analytics: AdminAnalyticsDto = {
  dailySeries: [
    {
      completions: 1,
      date: "2026-06-13",
      signups: 0,
    },
    {
      completions: 2,
      date: "2026-06-14",
      signups: 1,
    },
  ],
  streakBuckets: [
    {
      count: 1,
      label: "0일",
    },
    {
      count: 2,
      label: "1-3일",
    },
    {
      count: 0,
      label: "4-7일",
    },
    {
      count: 0,
      label: "8-14일",
    },
    {
      count: 0,
      label: "15일+",
    },
  ],
  worstLessons: [
    {
      completed: 1,
      completionRate: 50,
      courseId: "course-1",
      courseTitle: "활성 코스",
      dropOffRate: 50,
      lessonId: "lesson-2",
      lessonTitle: "둘째 레슨",
      started: 2,
    },
  ],
}

const lessonAnalytics: AdminLessonAnalyticsPageDto = {
  items: [
    {
      completed: 1,
      completionRate: 50,
      courseId: "course-1",
      courseTitle: "활성 코스",
      dropOffRate: 50,
      lessonId: "lesson-2",
      lessonTitle: "둘째 레슨",
      started: 2,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
  },
}

describe("어드민 API dashboard route", () => {
  it("운영 설정 저장 preflight에서 PUT method를 허용한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/notice", {
      headers: {
        "Access-Control-Request-Headers": "Authorization, Content-Type",
        "Access-Control-Request-Method": "PUT",
        Origin: "http://localhost:3003",
      },
      method: "OPTIONS",
    })

    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-methods")).toContain(
      "PUT"
    )
  })

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

describe("어드민 API analytics route", () => {
  it("관리자 세션이 없으면 분석 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
      },
    })
  })

  it("관리자 세션이 있으면 분석 기간 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics?days=2", {
      headers: {
        Authorization: "Bearer admin-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(analytics)
  })

  it("레슨별 분석 query를 파싱해 검색, 정렬, 페이지네이션 결과를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/analytics/lessons?page=1&pageSize=10&query=%EB%91%98%EC%A7%B8&sort=completionRate&direction=asc",
      {
        headers: {
          Authorization: "Bearer admin-token",
        },
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(lessonAnalytics)
  })

  it("허용하지 않는 분석 query는 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/analytics/lessons?direction=sideways",
      {
        headers: {
          Authorization: "Bearer admin-token",
        },
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
  })
})

describe("어드민 API users route", () => {
  it("관리자 세션이 없으면 사용자 목록 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/users")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
      },
    })
  })

  it("관리자 세션이 있으면 사용자 목록 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/users?page=1&pageSize=12&query=%ED%95%99%EC%8A%B5&status=active&sort=lastActive",
      {
        headers: {
          Authorization: "Bearer admin-token",
        },
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(userList)
  })

  it("사용자 상세, 상태 변경, 삭제 상태 전환을 제공한다", async () => {
    const app = createApp(createDependencies())
    const headers = {
      Authorization: "Bearer admin-token",
    }

    const detailResponse = await app.request("/users/user-1", { headers })

    expect(detailResponse.status).toBe(200)
    await expect(detailResponse.json()).resolves.toEqual(userDetail)

    const statusResponse = await app.request("/users/user-1/status", {
      body: JSON.stringify({ status: "suspended" }),
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    expect(statusResponse.status).toBe(200)
    await expect(statusResponse.json()).resolves.toEqual({
      ...userDetail,
      status: "suspended",
    })

    const deleteResponse = await app.request("/users/user-1", {
      headers,
      method: "DELETE",
    })

    expect(deleteResponse.status).toBe(200)
    await expect(deleteResponse.json()).resolves.toEqual({ deleted: true })
  })

  it("허용하지 않는 사용자 상태 변경은 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/users/user-1/status", {
      body: JSON.stringify({ status: "deleted" }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
  })
})

function createDependencies() {
  return createTestAdminApiDependencies({
    dashboardService: {
      async deleteUser(input) {
        expect(input.userId).toBe("user-1")
        return { deleted: true }
      },
      async getAnalytics(input) {
        expect(input).toEqual({
          days: 2,
          now: testAdminNow,
        })

        return analytics
      },
      async getDashboard() {
        return dashboard
      },
      async getLessonAnalytics(input) {
        expect(input).toEqual({
          direction: "asc",
          page: 1,
          pageSize: 10,
          query: "둘째",
          sort: "completionRate",
        })

        return lessonAnalytics
      },
      async getUser(input) {
        expect(input.userId).toBe("user-1")
        return userDetail
      },
      async getUsers(input) {
        expect(input).toEqual({
          page: 1,
          pageSize: 12,
          query: "학습",
          sort: "lastActive",
          status: "active",
        })
        return userList
      },
      async updateUserStatus(input) {
        expect(input.status).toBe("suspended")
        expect(input.userId).toBe("user-1")

        return {
          ...userDetail,
          status: "suspended",
        }
      },
    },
  })
}
