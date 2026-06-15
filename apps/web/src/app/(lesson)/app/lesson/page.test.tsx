import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import LessonRoute from "@/app/(lesson)/app/lesson/page"
import { apiFailure } from "@/lib/api/api-result"
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

describe("레슨 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("레슨 조회 실패를 fallback 콘텐츠로 숨기지 않는다", async () => {
    vi.mocked(api.getLesson).mockResolvedValue(
      apiFailure({
        code: "network-error",
        message: "네트워크 연결을 확인해 주세요.",
      })
    )
    vi.mocked(api.getCourseDetail).mockResolvedValue(
      apiFailure({
        code: "network-error",
        message: "네트워크 연결을 확인해 주세요.",
      })
    )

    render(
      await LessonRoute({
        searchParams: Promise.resolve({ lesson_id: "l1" }),
      })
    )

    expect(
      screen.getByRole("heading", { name: "레슨을 열 수 없습니다." })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "좋은 문장이란 무엇인가" })
    ).not.toBeInTheDocument()
  })
})
