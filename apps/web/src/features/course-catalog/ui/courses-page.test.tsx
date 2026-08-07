import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

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
  beforeEach(() => {
    getCourses.mockReset()
    refresh.mockReset()
  })

  it("카테고리 필터가 적용된 상태의 더 보기는 같은 카테고리로만 다음 페이지를 요청한다", async () => {
    const user = userEvent.setup()
    getCourses.mockResolvedValueOnce({ items: [], nextCursor: null })
    render(
      <CoursesPage
        categories={["입문자를 위한 코스", "문법 심화"]}
        courses={[grammarCourse]}
        filters={{ category: "문법 심화" }}
        nextCursor="next-page"
      />
    )

    await user.click(screen.getByRole("button", { name: "코스 더 보기" }))

    expect(getCourses).toHaveBeenCalledWith(
      { category: "문법 심화", cursor: "next-page" },
      { signal: expect.any(AbortSignal) }
    )
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
  })

  it("contract 실패를 더 보기 오류로 보여준다", async () => {
    const user = userEvent.setup()
    getCourses.mockRejectedValueOnce(
      new GeneratedApiClientError({
        kind: "contract",
        reason: "invalid-json-response",
        status: 200,
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

    await user.click(screen.getByRole("button", { name: "코스 더 보기" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "API 계약을 해석할 수 없습니다."
    )
  })
})
