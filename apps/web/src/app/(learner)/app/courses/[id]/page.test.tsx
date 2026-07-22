import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import CourseDetailRoute, {
  generateMetadata,
} from "@/app/(learner)/app/courses/[id]/page"
import { learnerCourseDetailSchema } from "@workspace/contracts/learning/learner-content"
import { networkApiError } from "@/shared/http/api-error"
import {
  httpApiFailure as apiFailure,
  httpApiOk as apiOk,
} from "@workspace/http-client/api-result"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"
import { createHttpNetworkError } from "@workspace/http-client/json-transport"

const api: WritingAppApi = {
  completeStep: vi.fn(),
  getCourseDetail: vi.fn(),
  getCourseCategories: vi.fn(),
  getLesson: vi.fn(),
  getProfile: vi.fn(),
  getProgress: vi.fn(),
  listCourses: vi.fn(),
  requestAiFeedback: vi.fn(),
  startLesson: vi.fn(),
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

vi.mock("@/server/auth/server-session-token", () => ({
  getServerLearnerSessionToken: vi.fn(async () => "learner-token"),
}))

vi.mock("@/server/http/get-server-writing-app-api", () => ({
  getServerWritingAppApi: vi.fn(() => api),
}))

const version = { curriculumVersionId: "c1-v1", revision: 1 }
const course = learnerCourseDetailSchema.parse({
  category: "입문자를 위한 코스",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 1,
  contentStatus: "active",
  learning: {
    completedLessons: 0,
    nextLesson: {
      currentStepId: "l1-s1",
      currentStepIndex: 0,
      estimatedMinutes: 5,
      id: "l1",
      title: "좋은 문장이란 무엇인가",
    },
    progressPercent: 0,
    status: "not_started",
    totalLessons: 1,
    version,
  },
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
          contentStatus: "active",
          learning: { status: "not_started", totalSteps: 1, version },
          sortOrder: 1,
          title: "좋은 문장이란 무엇인가",
        },
      ],
      sortOrder: 1,
      title: "문장의 기본기",
    },
  ],
  version,
})

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

  it("course 정보로 공유 metadata를 만들고 없는 course에는 canonical을 만들지 않는다", async () => {
    vi.mocked(api.getCourseDetail).mockResolvedValueOnce(apiOk(course))

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "c1" }),
    })

    expect(metadata).toMatchObject({
      alternates: { canonical: "/app/courses/c1" },
      description: course.description,
      openGraph: {
        images: [
          {
            alt: course.title,
            url: "/course-thumbnails/basic-sentence-writing.png",
          },
        ],
        title: course.title,
      },
      title: course.title,
    })

    vi.mocked(api.getCourseDetail).mockResolvedValueOnce(
      apiFailure(networkError())
    )
    const fallback = await generateMetadata({
      params: Promise.resolve({ id: "missing" }),
    })

    expect(fallback.alternates).toBeUndefined()
    expect(fallback.robots).toMatchObject({ follow: false, index: false })
  })

  it("코스 조회 실패를 fallback 콘텐츠로 숨기지 않는다", async () => {
    vi.mocked(api.getCourseDetail).mockResolvedValue(apiFailure(networkError()))

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

function networkError() {
  return networkApiError(
    createHttpNetworkError(
      new Request("https://api.example.test/test"),
      new TypeError("test network failure")
    )
  )
}
