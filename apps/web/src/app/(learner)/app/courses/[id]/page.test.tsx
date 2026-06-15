import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import CourseDetailRoute from "@/app/(learner)/app/courses/[id]/page"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

const api: WritingAppApi = {
  completeLesson: vi.fn(),
  createAiFeedback: vi.fn(),
  getCourseDetail: vi.fn(),
  getLesson: vi.fn(),
  getProfile: vi.fn(),
  getProgress: vi.fn(),
  listCourses: vi.fn(),
  saveLessonAnswer: vi.fn(),
}

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not-found")
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/lib/auth/server-session-token", () => ({
  getServerLearnerSessionToken: vi.fn(async () => "learner-token"),
}))

vi.mock("@/lib/api/get-server-writing-app-api", () => ({
  getServerWritingAppApi: vi.fn(() => api),
}))

describe("코스 상세 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("코스 또는 진행 정보 조회 실패를 fallback 콘텐츠로 숨기지 않는다", async () => {
    vi.mocked(api.getCourseDetail).mockResolvedValue(
      apiFailure({
        code: "network-error",
        message: "네트워크 연결을 확인해 주세요.",
      })
    )
    vi.mocked(api.getProgress).mockResolvedValue(
      apiOk({ courses: [], currentStreakDays: 0 })
    )

    render(
      await CourseDetailRoute({
        params: Promise.resolve({ id: "c1" }),
      })
    )

    expect(
      screen.getByRole("heading", { name: "코스를 열 수 없습니다." })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "글쓰기 첫걸음 30일" })
    ).not.toBeInTheDocument()
  })
})
