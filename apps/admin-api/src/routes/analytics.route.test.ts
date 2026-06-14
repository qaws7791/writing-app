import { describe, expect, it } from "vitest"

import { createApp, type AdminApiDependencies } from "@/app"
import type {
  AdminAnalyticsDto,
  AdminLessonAnalyticsPageDto,
} from "@workspace/core/admin"

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

function createDependencies(): AdminApiDependencies {
  return {
    adminOrigin: "http://localhost:3003",
    dashboardService: {
      async archiveCourse() {
        throw new Error("unexpected archive course request")
      },
      async createCourse() {
        throw new Error("unexpected create course request")
      },
      async deleteUser() {
        throw new Error("unexpected delete user request")
      },
      async getAnalytics(input) {
        expect(input).toEqual({
          days: 2,
          now: new Date("2026-06-14T03:00:00.000Z"),
        })
        return analytics
      },
      async getCourseEditor() {
        throw new Error("unexpected course editor request")
      },
      async getCourses() {
        throw new Error("unexpected course list request")
      },
      async getDashboard() {
        throw new Error("unexpected dashboard request")
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
      async getSettings() {
        throw new Error("unexpected settings request")
      },
      async getUser() {
        throw new Error("unexpected user detail request")
      },
      async getUsers() {
        throw new Error("unexpected user list request")
      },
      async resetContent() {
        throw new Error("unexpected content reset request")
      },
      async updateLegalSettings() {
        throw new Error("unexpected legal settings request")
      },
      async updateNoticeSettings() {
        throw new Error("unexpected notice settings request")
      },
      async updateUserStatus() {
        throw new Error("unexpected user status request")
      },
    },
    now() {
      return new Date("2026-06-14T03:00:00.000Z")
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
