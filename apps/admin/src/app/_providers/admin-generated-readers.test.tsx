import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getAdminAnalyticsMock,
  getAdminCoursesMock,
  getAdminDashboardMock,
  getAdminLessonAnalyticsMock,
  getAdminUsersMock,
  getServerAdminRequestOptionsMock,
} = vi.hoisted(() => ({
  getAdminAnalyticsMock: vi.fn(),
  getAdminCoursesMock: vi.fn(),
  getAdminDashboardMock: vi.fn(),
  getAdminLessonAnalyticsMock: vi.fn(),
  getAdminUsersMock: vi.fn(),
  getServerAdminRequestOptionsMock: vi.fn(),
}))

vi.mock("@workspace/http-client/admin", () => ({
  archiveAdminCourse: vi.fn(),
  createAdminCourse: vi.fn(),
  deleteAdminUser: vi.fn(),
  getAdminAnalytics: getAdminAnalyticsMock,
  getAdminCourses: getAdminCoursesMock,
  getAdminDashboard: getAdminDashboardMock,
  getAdminLessonAnalytics: getAdminLessonAnalyticsMock,
  getAdminUsers: getAdminUsersMock,
  publishAdminCourse: vi.fn(),
  saveAdminCourseEditor: vi.fn(),
  updateAdminUserStatus: vi.fn(),
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

import AdminAnalyticsRoute from "@/app/(admin)/analytics/page"
import AdminCoursesRoute from "@/app/(admin)/courses/page"
import AdminDashboardRoute from "@/app/(admin)/page"
import AdminUsersRoute from "@/app/(admin)/users/page"

const requestOptions = { cache: "no-store" } as const

describe("admin generated readers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerAdminRequestOptionsMock.mockResolvedValue(requestOptions)
  })

  it("dashboard generated reader를 직접 호출한다", async () => {
    const dashboard = {
      activeWindow: { from: "2026-07-18", to: "2026-07-24" },
      asOfDate: "2026-07-24",
      metrics: {
        activeUsersLast7Days: 8,
        activationRate: {
          denominator: 12,
          numerator: 8,
          percentage: 66.7,
          status: "available",
        },
        completedLessons: 72,
        d7ReturnRate: {
          denominator: 10,
          matureCohortThrough: "2026-07-16",
          numerator: 4,
          percentage: 40,
          status: "available",
        },
        firstLessonStarts: 8,
        totalUsers: 12,
      },
    }
    getAdminDashboardMock.mockResolvedValue(dashboard)

    const route = await AdminDashboardRoute()

    expect(getAdminDashboardMock).toHaveBeenCalledWith(requestOptions)
    expect(route.props.dashboardResult).toEqual({
      status: "ok",
      value: dashboard,
    })
  })

  it("analytics summary와 URL 기반 lesson query를 병렬 generated reader로 호출한다", async () => {
    getAdminAnalyticsMock.mockResolvedValue({
      dailySeries: [],
      from: "2026-06-25",
      matureCohortThrough: "2026-07-17",
      to: "2026-07-24",
      worstAiFeedbackLessons: [],
      worstLessons: [],
    })
    getAdminLessonAnalyticsMock.mockResolvedValue({
      items: [],
      pagination: {
        page: 3,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      },
    })

    const route = await AdminAnalyticsRoute({
      searchParams: Promise.resolve({
        direction: "desc",
        page: "3",
        pageSize: "20",
        query: "문장",
        sort: "dropOff",
      }),
    })

    expect(getAdminAnalyticsMock).toHaveBeenCalledWith(
      { days: 30 },
      requestOptions
    )
    expect(getAdminLessonAnalyticsMock).toHaveBeenCalledWith(
      {
        direction: "desc",
        page: 3,
        pageSize: 20,
        query: "문장",
        sort: "dropOff",
      },
      requestOptions
    )
    expect(route.props.filters).toEqual({
      direction: "desc",
      page: 3,
      pageSize: 20,
      query: "문장",
      sort: "dropOff",
    })
  })

  it("users URL filter를 generated reader query로 전달한다", async () => {
    getAdminUsersMock.mockResolvedValue({
      items: [],
      pagination: {
        page: 2,
        pageSize: 20,
        totalItems: 0,
        totalPages: 1,
      },
    })

    const route = await AdminUsersRoute({
      searchParams: Promise.resolve({
        page: "2",
        pageSize: "20",
        query: "민지",
        sort: "joined",
        status: "suspended",
      }),
    })

    expect(getAdminUsersMock).toHaveBeenCalledWith(
      {
        page: 2,
        pageSize: 20,
        query: "민지",
        sort: "joined",
        status: "suspended",
      },
      requestOptions
    )
    expect(route.props.usersResult.status).toBe("ok")
  })

  it("courses URL filter를 generated reader query로 전달한다", async () => {
    getAdminCoursesMock.mockResolvedValue({
      items: [],
      pagination: {
        page: 2,
        pageSize: 50,
        totalItems: 0,
        totalPages: 1,
      },
    })

    const route = await AdminCoursesRoute({
      searchParams: Promise.resolve({
        category: "문법",
        page: "2",
        pageSize: "50",
        query: "문장",
        status: "archived",
      }),
    })

    expect(getAdminCoursesMock).toHaveBeenCalledWith(
      {
        category: "문법",
        page: 2,
        pageSize: 50,
        query: "문장",
        status: "archived",
      },
      requestOptions
    )
    expect(route.props.coursesResult.status).toBe("ok")
  })
})
