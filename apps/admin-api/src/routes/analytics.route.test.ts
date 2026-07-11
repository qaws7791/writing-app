import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminAnalyticsDto,
  AdminLessonAnalyticsPageDto,
} from "@workspace/contracts/admin"

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
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it("관리자 세션이 있으면 분석 기간 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics?days=2", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(analytics)
  })

  it("분석 기간 query가 상한을 넘으면 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics?days=366", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })

  it("레슨별 분석 query를 파싱해 검색, 정렬, 페이지네이션 결과를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/analytics/lessons?page=1&pageSize=10&query=%EB%91%98%EC%A7%B8&sort=completionRate&direction=asc",
      {
        headers: {
          Cookie: "admin_session_token=admin-token",
        },
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(lessonAnalytics)
  })

  it("레슨별 분석 페이지 크기 query가 상한을 넘으면 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/analytics/lessons?pageSize=101", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })

  it("허용하지 않는 분석 query는 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/analytics/lessons?direction=sideways",
      {
        headers: {
          Cookie: "admin_session_token=admin-token",
        },
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })
})

function createDependencies() {
  return createTestAdminApiDependencies({
    adminServices: {
      analytics: {
        async getAnalytics(input) {
          expect(input).toEqual({
            days: 2,
            now: testAdminNow,
          })

          return analytics
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
      },
    },
  })
}
