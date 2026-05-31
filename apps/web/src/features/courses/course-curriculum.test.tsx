import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CourseCurriculum } from "@/features/courses/course-curriculum"
import { courseDetails } from "@/features/courses/course-detail-data"

type AnchorProps = React.ComponentProps<"a">

vi.mock("next/link", async () => {
  const ReactModule = await import("react")

  return {
    default: ({ children, href, ...props }: AnchorProps & { href: string }) =>
      ReactModule.createElement("a", { href, ...props }, children),
  }
})

vi.mock("@workspace/ui/components/icons", () => ({
  CheckCircleIcon: () => <span aria-hidden="true" />,
  CheckIcon: () => <span aria-hidden="true" />,
  ChevronDownIcon: () => <span aria-hidden="true" />,
  CircleIcon: () => <span aria-hidden="true" />,
}))

vi.mock("@workspace/ui/components/ui/separator", () => ({
  Separator: () => <hr />,
}))

afterEach(() => {
  cleanup()
})

describe("CourseCurriculum", () => {
  it("renders chapters with native disclosure elements", () => {
    const course = courseDetails[0]

    if (!course) {
      throw new Error("테스트 코스 데이터가 없습니다.")
    }

    const { container } = render(<CourseCurriculum course={course} />)
    const chapterDisclosures = container.querySelectorAll("details")

    expect(chapterDisclosures).toHaveLength(course.chapters.length)
    expect(chapterDisclosures[0]).toHaveProperty("open", true)
    expect(screen.getByText("문장의 뼈대")).toBeTruthy()
    expect(
      screen.getByRole("link", { name: "주어와 서술어 찾기" })
    ).toHaveProperty(
      "href",
      expect.stringContaining("lesson_id=sentence-structure-01")
    )
  })
})
