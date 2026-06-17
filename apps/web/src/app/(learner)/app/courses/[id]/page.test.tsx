import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import CourseDetailRoute from "@/app/(learner)/app/courses/[id]/page"
import type { CourseDetail } from "@/features/courses/course-types"
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

const course: CourseDetail = {
  category: "입문자를 위한 코스",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 1,
  progress: {
    completedLessons: 0,
    lessons: [
      {
        currentStepIndex: null,
        lessonId: "l1",
        status: "available",
      },
    ],
    nextLesson: {
      currentStepIndex: null,
      estimatedMinutes: 5,
      id: "l1",
      status: "available",
      title: "좋은 문장이란 무엇인가",
    },
    totalLessons: 1,
  },
  progressPercent: 0,
  status: "active",
  title: "글쓰기 첫걸음 30일",
  visualKey: "basic-sentence-writing",
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "문장",
          description: "좋은 문장을 배웁니다.",
          estimatedMinutes: 5,
          id: "l1",
          order: 1,
          status: "active",
          title: "좋은 문장이란 무엇인가",
        },
      ],
      order: 1,
      title: "문장의 기본기",
    },
  ],
}

describe("코스 상세 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("course 상세만 조회하고 progress 목록을 별도로 조회하지 않는다", async () => {
    vi.mocked(api.getCourseDetail).mockResolvedValue(apiOk(course))

    render(
      await CourseDetailRoute({
        params: Promise.resolve({ id: "c1" }),
      })
    )

    expect(api.getCourseDetail).toHaveBeenCalledWith("c1")
    expect(api.getProgress).not.toHaveBeenCalled()
    expect(
      screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
    ).toBeInTheDocument()
  })

  it("코스 조회 실패를 fallback 콘텐츠로 숨기지 않는다", async () => {
    vi.mocked(api.getCourseDetail).mockResolvedValue(
      apiFailure({
        code: "network-error",
        message: "네트워크 연결을 확인해 주세요.",
      })
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
