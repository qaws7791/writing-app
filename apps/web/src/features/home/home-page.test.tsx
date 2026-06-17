import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HomePage } from "@/features/home/home-page"
import type { ProgressCourseList } from "@/features/courses/course-types"

const emptyProgress: ProgressCourseList = {
  courses: [],
  currentStreakDays: 0,
}

const progressWithActiveCourse: ProgressCourseList = {
  courses: [
    {
      id: "c1",
      lessons: [
        {
          currentStepIndex: null,
          estimatedMinutes: 5,
          id: "l1",
          status: "completed",
          title: "좋은 문장이란 무엇인가",
        },
        {
          currentStepIndex: null,
          estimatedMinutes: 7,
          id: "l2",
          status: "available",
          title: "짧게 쓰기",
        },
        {
          currentStepIndex: null,
          estimatedMinutes: 8,
          id: "l3",
          status: "locked",
          title: "문단 다듬기",
        },
      ],
      nextLessons: [
        {
          courseId: "c1",
          currentStepIndex: null,
          estimatedMinutes: 7,
          id: "l2",
          status: "available",
          title: "짧게 쓰기",
        },
      ],
      progressPercent: 33,
      title: "글쓰기 첫걸음 30일",
      visualKey: "basic-sentence-writing",
    },
  ],
  currentStreakDays: 2,
}

const completedProgress: ProgressCourseList = {
  courses: [
    {
      id: "c2",
      lessons: [
        {
          currentStepIndex: null,
          estimatedMinutes: 5,
          id: "l4",
          status: "completed",
          title: "완료한 레슨",
        },
      ],
      nextLessons: [],
      progressPercent: 100,
      title: "완료한 코스",
      visualKey: "expression",
    },
  ],
  currentStreakDays: 5,
}

describe("홈 화면", () => {
  it("Kwep 홈 fresh 상태의 인사, 통계, 첫 코스 링크를 보여준다", () => {
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

    const startCard = screen.getByRole("link", { name: /코스 둘러보기/ })
    expect(startCard).toHaveAttribute("href", "/app/courses")
    expect(
      within(startCard).getByText("지금 시작해볼까요?")
    ).toBeInTheDocument()
    expect(
      within(startCard).getByRole("heading", {
        name: /첫 번째 코스를\s*선택해 보세요/,
      })
    ).toBeInTheDocument()
    expect(within(startCard).getByText("코스 둘러보기")).toBeInTheDocument()
  })

  it("진행 중 코스와 다음 레슨 링크를 보여준다", () => {
    render(<HomePage learnerName="몽쉘" progress={progressWithActiveCourse} />)

    expect(screen.getByText("이어서 학습하기")).toBeInTheDocument()
    expect(screen.getByText("1개 코스")).toBeInTheDocument()
    expect(screen.getAllByText("글쓰기 첫걸음 30일")).toHaveLength(2)
    expect(screen.getAllByText("1/3")).toHaveLength(2)
    expect(screen.getAllByText("짧게 쓰기")).toHaveLength(2)
    expect(document.querySelector(".border-t")).toBeNull()

    expect(
      firstElement(screen.getAllByRole("link", { name: /글쓰기 첫걸음 30일/ }))
    ).toHaveAttribute("href", "/app/courses/c1")
    expect(
      firstElement(screen.getAllByRole("link", { name: /짧게 쓰기/ }))
    ).toHaveAttribute("href", "/app/lesson?lesson_id=l2")
  })

  it("다음 레슨이 없는 진행 코스에는 완료 메시지를 보여준다", () => {
    render(<HomePage learnerName="몽쉘" progress={completedProgress} />)

    expect(screen.getByText("이어서 학습하기")).toBeInTheDocument()
    expect(screen.getAllByText("완료한 코스")).toHaveLength(2)
    expect(screen.getAllByText("모든 레슨을 완료했어요")).toHaveLength(2)
  })
})

function firstElement<TElement>(elements: readonly TElement[]): TElement {
  const element = elements[0]

  if (element === undefined) {
    throw new Error("첫 번째 요소를 찾지 못했습니다.")
  }

  return element
}
