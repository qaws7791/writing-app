import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const { generatedClient, requestOptions, serverOptionsMock } = vi.hoisted(
  () => ({
    generatedClient: {
      getCourseDetail: vi.fn(),
      getProgress: vi.fn(),
    },
    requestOptions: { cache: "no-store" } as const,
    serverOptionsMock: vi.fn(),
  })
)

vi.mock("@workspace/http-client/learner", () => generatedClient)
vi.mock("@/server/http/learner-api-client", () => ({
  getServerLearnerRequestOptions: serverOptionsMock,
}))
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

import CourseDetailRoute, {
  generateMetadata,
} from "@/app/(learner)/app/courses/[id]/page"
import type { LearnerCourseDetailDto } from "@/shared/http/learner-api-client"

const version = { curriculumVersionId: "c1-v1", revision: 1 }
const course: LearnerCourseDetailDto = {
  category: "입문자를 위한 코스",
  contentStatus: "active",
  cover: null,
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
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
  lessonCount: 1,
  title: "글쓰기 첫걸음 30일",
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "문장",
          contentStatus: "active",
          description: "좋은 문장을 배웁니다.",
          estimatedMinutes: 5,
          id: "l1",
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
  visualKey: "basic-sentence-writing",
}

describe("코스 상세 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverOptionsMock.mockResolvedValue(requestOptions)
  })

  it("course 상세만 조회하고 progress 목록을 별도로 조회하지 않는다", async () => {
    generatedClient.getCourseDetail.mockResolvedValue(course)

    render(
      await CourseDetailRoute({
        params: Promise.resolve({ id: "c1" }),
      })
    )

    expect(generatedClient.getCourseDetail).toHaveBeenCalledWith(
      "c1",
      requestOptions
    )
    expect(generatedClient.getProgress).not.toHaveBeenCalled()
    expect(
      screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
    ).toBeInTheDocument()
  })

  it("course 정보로 공유 metadata를 만들고 없는 course에는 canonical을 만들지 않는다", async () => {
    generatedClient.getCourseDetail.mockResolvedValueOnce(course)

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

    generatedClient.getCourseDetail.mockRejectedValueOnce(networkError())
    const fallback = await generateMetadata({
      params: Promise.resolve({ id: "missing" }),
    })

    expect(fallback.alternates).toBeUndefined()
    expect(fallback.robots).toMatchObject({ follow: false, index: false })
  })

  it("코스 조회 실패를 fallback 콘텐츠로 숨기지 않는다", async () => {
    generatedClient.getCourseDetail.mockRejectedValue(networkError())

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

function networkError(): GeneratedApiClientError {
  return new GeneratedApiClientError({
    kind: "network",
    method: "GET",
    url: "/api/courses/c1",
  })
}
