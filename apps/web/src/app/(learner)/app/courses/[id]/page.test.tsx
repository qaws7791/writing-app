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
import { createLearnerCourseDetailFixture } from "@/test/learner-api-fixtures"

const course = createLearnerCourseDetailFixture({
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
})

describe("코스 상세 route", () => {
  beforeEach(() => {
    serverOptionsMock.mockResolvedValue(requestOptions)
  })

  it("조회한 course 정보로 공유 metadata와 canonical 경로를 만든다", async () => {
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
  })

  it("조회할 수 없는 course에는 canonical 없이 색인을 차단한다", async () => {
    generatedClient.getCourseDetail.mockRejectedValueOnce(networkError())

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "missing" }),
    })

    expect(metadata.alternates).toBeUndefined()
    expect(metadata.robots).toMatchObject({ follow: false, index: false })
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
