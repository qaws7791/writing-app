import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import type { AdminCourseDetailDto } from "@workspace/core/admin"

const course: AdminCourseDetailDto = {
  category: "입문자를 위한 코스",
  description: "글쓰기 입문 과정",
  id: "c1",
  revision: 3,
  status: "active",
  title: "글쓰기 첫걸음 30일",
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "기초",
          description: "문장을 시작합니다.",
          estimatedMinutes: 7,
          id: "l1",
          sortOrder: 1,
          status: "active",
          summary: ["좋은 문장은 모호하지 않다", "문장에는 초점이 필요하다"],
          steps: [
            step("s1", "READING", { body: "읽기 본문", title: "읽기" }),
            step("s2", "COMPARE", { after: "수정", before: "초안" }),
            step("s3", "MULTIPLE_CHOICE", { answer: "A", prompt: "정답은?" }),
            step("s4", "FILL_BLANK", { answer: "문장", prompt: "빈칸" }),
            step("s5", "SELECT", { segments: ["좋은", "문장"] }),
            step("s6", "ORDER", { items: ["도입", "전개"] }),
            step("s7", "WRITE", { goal: 150, max: 500, min: 50 }),
            step("s8", "AI_FEEDBACK", { retryLimit: 3, sourceStepId: "s7" }),
            step("s9", "MATCH", { pairs: [{ left: "A", right: "B" }] }),
            step("s10", "CATEGORIZE", {
              categories: ["주장"],
              items: ["근거"],
            }),
          ],
          title: "첫 레슨",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "1주차",
    },
  ],
}

describe("CourseEditorShell", () => {
  it("코스, 레슨, 10개 스텝 폼과 학습자 시작 미리보기를 렌더링한다", () => {
    render(<CourseEditorShell course={course} />)

    expect(screen.getByRole("heading", { name: "코스 미리보기" })).toBeVisible()
    expect(screen.getByText("읽기 전용 미리보기")).toBeVisible()
    expect(screen.getByDisplayValue("글쓰기 첫걸음 30일")).toBeVisible()
    expect(screen.getByDisplayValue("첫 레슨")).toBeVisible()
    expect(screen.getByLabelText("예상 시간")).toHaveValue(7)
    expect(screen.getByLabelText("레슨 요약")).toHaveValue(
      JSON.stringify(
        ["좋은 문장은 모호하지 않다", "문장에는 초점이 필요하다"],
        null,
        2
      )
    )
    expect(screen.getByDisplayValue("글쓰기 첫걸음 30일")).toBeDisabled()
    expect(screen.getByDisplayValue("첫 레슨")).toBeDisabled()

    const forms = screen.getByRole("list", { name: "스텝 편집 폼" })
    for (const label of [
      "READING",
      "COMPARE",
      "MULTIPLE_CHOICE",
      "FILL_BLANK",
      "SELECT",
      "ORDER",
      "WRITE",
      "AI_FEEDBACK",
      "MATCH",
      "CATEGORIZE",
    ]) {
      expect(within(forms).getByText(label)).toBeVisible()
    }

    expect(screen.getByText("segments 입력 보조")).toBeVisible()
    expect(screen.getByText("min 50 · goal 150 · max 500")).toBeVisible()
    expect(screen.getByText("source step: s7 · retry 3회")).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "학습자 미리보기" })
    ).toBeVisible()
    expect(screen.getByText("시작 화면")).toBeVisible()
    expect(screen.getByText("7분 · 10개 스텝")).toBeVisible()
  })

  it("전용 폼이 없는 스텝 타입은 generic content JSON 폼으로 렌더링한다", () => {
    const firstUnit = course.units[0]
    const firstLesson = firstUnit?.lessons[0]

    if (firstUnit === undefined || firstLesson === undefined) {
      throw new Error("테스트 코스 fixture에 첫 유닛과 첫 레슨이 필요합니다.")
    }

    const courseWithUnknownStep: AdminCourseDetailDto = {
      ...course,
      units: [
        {
          ...firstUnit,
          lessons: [
            {
              ...firstLesson,
              steps: [
                step("s99", "VOICE_RECOGNITION", {
                  prompt: "문장을 읽어보세요.",
                }),
              ],
            },
          ],
        },
      ],
    }

    render(<CourseEditorShell course={courseWithUnknownStep} />)

    expect(screen.getByText("VOICE_RECOGNITION")).toBeVisible()
    expect(screen.getByText("content JSON")).toBeVisible()
    expect(
      screen.getByDisplayValue('{"prompt":"문장을 읽어보세요."}')
    ).toBeVisible()
  })
})

function step(id: string, type: string, content: unknown) {
  return {
    contentJson: JSON.stringify(content),
    id,
    sortOrder: Number(id.replace("s", "")),
    status: "active" as const,
    type,
  }
}
