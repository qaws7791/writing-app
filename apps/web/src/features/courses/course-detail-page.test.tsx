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
  thumbnail: "/course-thumbnails/sentence-structure.png",
  progress: {
    completedLessons: 0,
    totalLessons: 12,
    percentage: 0,
  },
  nextLesson: {
    chapterLabel: "1단원",
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

  it("shows an available curriculum upgrade notice", () => {
    render(
      <CourseDetailPage
        course={notStartedCourse}
        curriculumUpgrade={{
          completedCount: 1,
          courseId: "sentence-structure" as never,
          fromVersion: {
            id: "sentence-structure-v1",
            title: "문장 구조의 기본",
            versionNumber: 1,
          },
          message: "새 커리큘럼에는 새 예제와 복습 경로를 추가했습니다.",
          migrationId: "sentence-structure-v1-to-sentence-structure-v2",
          status: "available",
          toVersion: {
            changelog: "새 예제와 복습 경로를 추가했습니다.",
            id: "sentence-structure-v2",
            title: "문장 구조의 기본 v2",
            versionNumber: 2,
          },
          totalLessons: 12,
        }}
      />
    )

    expect(screen.getByText("새 커리큘럼이 도착했습니다")).toBeDefined()
    expect(
      screen.getByText("새 커리큘럼에는 새 예제와 복습 경로를 추가했습니다.")
    ).toBeDefined()
    expect(
      screen.getByRole("button", { name: "새 버전으로 업그레이드" })
    ).toBeDefined()
    expect(screen.getByRole("button", { name: "나중에 결정" })).toBeDefined()
  })

  it("does not show curriculum upgrade notice when it is not available", () => {
    render(
      <CourseDetailPage
        course={notStartedCourse}
        curriculumUpgrade={{
          courseId: "sentence-structure" as never,
          status: "not-available",
        }}
      />
    )

    expect(screen.queryByText("새 커리큘럼이 도착했습니다")).toBeNull()
  })
})
