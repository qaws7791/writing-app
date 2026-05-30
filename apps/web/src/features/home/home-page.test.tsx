import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { HomePage } from "@/features/home/home-page"

vi.mock("@workspace/ui/components/ui/progress-bar", () => ({
  ProgressBar: ({ value }: { value: number }) => (
    <div aria-label="progress" data-value={value} />
  ),
}))

vi.mock("@workspace/ui/components/icons", () => ({
  CheckIcon: () => <span aria-hidden="true" />,
  ChevronRightIcon: () => <span aria-hidden="true" />,
  LockIcon: () => <span aria-hidden="true" />,
  PlayIcon: () => <span aria-hidden="true" />,
}))

describe("HomePage", () => {
  it("renders only the courses provided by learner progress data", () => {
    render(
      <HomePage
        courses={[
          {
            id: "api-course" as never,
            title: "API 코스",
            description: "백엔드에서 받은 코스입니다.",
            completedLessons: 1,
            totalLessons: 2,
            progressPercent: 50,
            lessons: [
              {
                id: "api-lesson-01" as never,
                name: "1강. API 레슨",
                status: "next-up",
              },
            ],
          },
        ]}
      />
    )

    expect(screen.getByText("총 1개 진행 중")).toBeDefined()
    expect(screen.getByText("API 코스")).toBeDefined()
    expect(screen.queryByText("기초 문장 만들기")).toBeNull()
  })

  it("renders an empty state when learner progress is empty", () => {
    render(<HomePage courses={[]} />)

    expect(screen.getByText("총 0개 진행 중")).toBeDefined()
    expect(screen.getByText("아직 진행 중인 코스가 없습니다.")).toBeDefined()
  })
})
