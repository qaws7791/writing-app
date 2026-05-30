import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CourseDetailPage } from "@/features/courses/course-detail-page"
import { courseId } from "@/features/courses/course-ids"
import type {
  CourseDetail,
  CourseLessonId,
} from "@/features/courses/course-detail-data"

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

vi.mock("@workspace/ui/components/ui/progress-bar", () => ({
  ProgressBar: ({ value }: { value: number }) => (
    <div aria-label="progress" data-value={value} />
  ),
}))

vi.mock("@workspace/ui/components/ui/card", () => ({
  Card: ({ children }: React.PropsWithChildren) => (
    <section>{children}</section>
  ),
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardFooter: ({ children }: React.PropsWithChildren) => (
    <footer>{children}</footer>
  ),
  CardHeader: ({ children }: React.PropsWithChildren) => (
    <header>{children}</header>
  ),
}))

vi.mock("@workspace/ui/components/ui/button", () => ({
  Button: ({
    children,
    render,
  }: React.PropsWithChildren<{ render?: React.ReactElement }>) =>
    render ? (
      React.cloneElement(render, {}, children)
    ) : (
      <button type="button">{children}</button>
    ),
}))

vi.mock("@workspace/ui/components/ui/separator", () => ({
  Separator: () => <hr />,
}))

vi.mock("@workspace/ui/components/icons", () => ({
  PlayIcon: () => <span aria-hidden="true" />,
  SparklesIcon: () => <span aria-hidden="true" />,
}))

vi.mock("@/features/courses/course-curriculum", () => ({
  CourseCurriculum: () => <section aria-label="커리큘럼" />,
}))

const notStartedCourse = {
  id: courseId("sentence-structure"),
  title: "문장 구조의 기본",
  description: "한국어 문장의 뼈대를 이해합니다.",
  progress: {
    completedLessons: 0,
    totalLessons: 12,
    percentage: 0,
  },
  nextLesson: {
    title: "주어와 서술어 찾기",
    description: "문장의 중심 성분을 구분합니다.",
    lessonId: "sentence-structure-01" as CourseLessonId,
  },
  chapters: [],
} as CourseDetail

afterEach(() => {
  cleanup()
})

describe("CourseDetailPage", () => {
  it("shows a start action without progress before the learner starts the course", () => {
    render(<CourseDetailPage course={notStartedCourse} />)

    expect(screen.queryByText("전체 진행률")).toBeNull()
    expect(screen.queryByText("0%")).toBeNull()
    expect(screen.getByText("첫 레슨 시작")).toBeDefined()
    expect(screen.getByRole("link", { name: "시작하기" })).toBeDefined()
    expect(screen.queryByText("이어서 학습하기")).toBeNull()
  })

  it("does not show curriculum upgrade notice", () => {
    render(<CourseDetailPage course={notStartedCourse} />)

    expect(screen.queryByText("새 커리큘럼이 도착했습니다")).toBeNull()
  })
})
