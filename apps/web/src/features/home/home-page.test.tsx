import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { HomePage } from "@/features/home/home-page"
import type { ProgressCourseList } from "@/features/courses/course-types"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}))

const emptyProgress: ProgressCourseList = {
  courses: [],
  currentStreakDays: 0,
}

describe("홈 화면", () => {
  beforeEach(() => {
    push.mockClear()
  })

  it("Kwep 홈 fresh 상태의 인사, 통계, 첫 코스 진입점을 보여준다", async () => {
    const user = userEvent.setup()

    render(<HomePage learnerName="글쓰기 탐험가" progress={emptyProgress} />)

    expect(screen.getByText("안녕하세요 👋")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: /글쓰기님,\s*오늘도 함께 써봐요\./,
      })
    ).toBeInTheDocument()
    expect(screen.getByText("0일")).toBeInTheDocument()
    expect(screen.getByText("연속 학습")).toBeInTheDocument()
    expect(screen.getByText("0개")).toBeInTheDocument()
    expect(screen.getByText("완료한 레슨")).toBeInTheDocument()

    const startCard = screen
      .getByText("지금 시작해볼까요?")
      .closest("div")?.parentElement
    expect(startCard).not.toBeNull()
    expect(startCard?.tagName).toBe("DIV")
    expect(
      within(startCard as HTMLElement).getByText("지금 시작해볼까요?")
    ).toBeInTheDocument()
    expect(
      within(startCard as HTMLElement).getByRole("heading", {
        name: /첫 번째 코스를\s*선택해 보세요/,
      })
    ).toBeInTheDocument()
    expect(
      within(startCard as HTMLElement).getByText("코스 둘러보기")
    ).toBeInTheDocument()

    await user.click(startCard as HTMLElement)

    expect(push).toHaveBeenCalledWith("/app/courses")
  })
})
