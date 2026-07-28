import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const { getCourses, refresh } = vi.hoisted(() => ({
  getCourses: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("@workspace/http-client/learner", () => ({ getCourses }))
vi.mock("next/navigation", () => ({
  useRouter() {
    return { refresh }
  },
}))

import { CoursesPage } from "@/features/course-catalog/ui/courses-page"
import type { LearnerCourseSummaryDto } from "@/shared/http/learner-api-client"

const version = { curriculumVersionId: "c1-v1", revision: 1 }
const beginnerCourse: LearnerCourseSummaryDto = {
  category: "입문자를 위한 코스",
  cover: null,
  description:
    "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 10,
  contentStatus: "active",
  title: "글쓰기 첫걸음 30일",
  visualKey: "basic-sentence-writing",
  version,
}
const grammarCourse: LearnerCourseSummaryDto = {
  category: "문법 심화",
  cover: null,
  description:
    "주술 호응, 시제, 조사 사용까지 한국어 문장을 단단하게 만드는 문법.",
  id: "c2",
  lessonCount: 8,
  contentStatus: "active",
  title: "문장의 기본 문법",
  visualKey: "grammar-complete",
  version: { curriculumVersionId: "c2-v1", revision: 1 },
}
describe("코스 목록 화면", () => {
  it("카테고리 탐색과 코스 목록을 보여준다", () => {
    render(
      <CoursesPage
        categories={["입문자를 위한 코스", "문법 심화"]}
        courses={[grammarCourse, beginnerCourse]}
        filters={{ category: "" }}
      />
    )

    expect(
      screen.queryByRole("combobox", { name: "정렬" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "문법 심화" })).toHaveAttribute(
      "href",
      "/app/courses?category=%EB%AC%B8%EB%B2%95+%EC%8B%AC%ED%99%94"
    )
    expect(screen.getAllByRole("link", { name: /문장/ })[0]).toHaveAttribute(
      "href",
      "/app/courses/c2"
    )
    expect(screen.getByText("글쓰기 첫걸음 30일")).toBeInTheDocument()
  })

  it("카테고리에 코스가 없으면 전체 코스 링크를 보여준다", () => {
    render(
      <CoursesPage
        categories={["입문자를 위한 코스", "문법 심화"]}
        courses={[]}
        filters={{
          category: "문법 심화",
        }}
      />
    )

    expect(screen.getByRole("status")).toHaveTextContent(
      "이 카테고리에는 코스가 없습니다."
    )
    expect(
      screen.getByRole("link", { name: "전체 코스 보기" })
    ).toHaveAttribute("href", "/app/courses")
  })

  it("빈 코스 목록은 fallback 코스 대신 empty state로 보여준다", () => {
    render(
      <CoursesPage categories={[]} courses={[]} filters={{ category: "" }} />
    )

    expect(screen.getByRole("status")).toHaveTextContent(
      "아직 열려 있는 코스가 없습니다."
    )
    expect(
      screen.queryByRole("link", { name: /글쓰기 첫걸음 30일/ })
    ).not.toBeInTheDocument()
  })

  it.each([
    [
      "network",
      new GeneratedApiClientError({
        kind: "network",
        method: "GET",
        url: "courses",
      }),
      "API에 연결할 수 없습니다.",
    ],
    [
      "contract",
      new GeneratedApiClientError({
        kind: "contract",
        reason: "invalid-json-response",
        status: 200,
      }),
      "API 계약을 해석할 수 없습니다.",
    ],
  ])("%s 실패를 더 보기 오류로 보여준다", async (_kind, error, message) => {
    getCourses.mockRejectedValueOnce(error)
    render(
      <CoursesPage
        categories={[]}
        courses={[beginnerCourse]}
        filters={{ category: "" }}
        nextCursor="next-page"
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "코스 더 보기" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(message)
  })

  it("더 보기 중 401이면 서버 route를 다시 확인한다", async () => {
    getCourses.mockRejectedValueOnce(
      new GeneratedApiClientError({
        error: {
          code: "UNAUTHENTICATED",
          message: "로그인이 필요합니다.",
          requestId: "request-1",
          violations: [],
        },
        kind: "http",
        retryAfterSeconds: null,
        status: 401,
      })
    )
    render(
      <CoursesPage
        categories={[]}
        courses={[beginnerCourse]}
        filters={{ category: "" }}
        nextCursor="next-page"
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "코스 더 보기" }))

    expect(refresh).toHaveBeenCalledOnce()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
