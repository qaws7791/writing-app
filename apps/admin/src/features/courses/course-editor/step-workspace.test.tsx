import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AdminEditorStepType } from "@workspace/core/admin"

import { getStepTypeLabel } from "@/features/courses/course-editor/editor-labels"
import { StepWorkspace } from "@/features/courses/course-editor/step-workspace"

const stepTypes: AdminEditorStepType[] = [
  "INTRO",
  "CONCEPT",
  "READING_PASSAGE",
  "EXAMPLE_REVEAL",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "WORD_SELECT",
  "REORDER",
  "MATCH",
  "CLASSIFY",
  "SHORT_WRITE",
  "LONG_WRITE",
  "AI_FEEDBACK",
  "REVISION",
  "CHECKLIST",
  "REFLECTION",
  "SUMMARY",
  "TRANSCRIBE",
  "COMPLETE",
]

afterEach(() => {
  cleanup()
})

describe("StepWorkspace", () => {
  it.each(stepTypes)("renders a dedicated form for %s", (type) => {
    render(
      <StepWorkspace
        lessonSteps={[]}
        step={{
          id: `${type}-step`,
          lessonId: "lesson-1",
          type,
          title: `${type} step`,
          sortOrder: 1,
          points: 10,
          required: true,
          status: "active",
          content: {},
        }}
      />
    )

    expect(screen.getByText(`${getStepTypeLabel(type)} 편집`)).toBeTruthy()
    expect(screen.getByText("활성 · 10점 · 필수 스텝")).toBeTruthy()
    expect(screen.queryByText(`${type} · active`)).toBeNull()
    expect(screen.queryByText("10 XP · 필수 스텝")).toBeNull()
  })

  it("renders enum-like step titles through Korean display labels", () => {
    render(
      <StepWorkspace
        lessonSteps={[
          {
            id: "write-step",
            lessonId: "lesson-1",
            type: "SHORT_WRITE",
            title: "SHORT_WRITE",
            sortOrder: 1,
            points: 10,
            required: true,
            status: "active",
            content: {},
          },
        ]}
        step={{
          id: "feedback-step",
          lessonId: "lesson-1",
          type: "AI_FEEDBACK",
          title: "AI_FEEDBACK",
          sortOrder: 2,
          points: 0,
          required: true,
          status: "active",
          content: {
            sourceStepId: "write-step",
          },
        }}
      />
    )

    expect(screen.getAllByText("AI 피드백").length).toBeGreaterThan(0)
    expect(screen.getByRole("option", { name: "짧은 글쓰기" })).toBeTruthy()
    expect(screen.queryByText("AI_FEEDBACK")).toBeNull()
    expect(screen.queryByText("SHORT_WRITE")).toBeNull()
  })

  it("renders intro content fields from actual content keys and emits typed updates", () => {
    const onUpdateStepContent = vi.fn()

    render(
      <StepWorkspace
        lessonSteps={[]}
        onUpdateStepContent={onUpdateStepContent}
        step={{
          id: "intro-step",
          lessonId: "lesson-1",
          type: "INTRO",
          title: "도입",
          sortOrder: 1,
          points: 0,
          required: true,
          status: "active",
          content: {
            title: "문장 성분 점검표",
            category: "문법",
            bullets: ["첫 기준", "둘째 기준"],
            estimatedMinutes: 8,
          },
        }}
      />
    )

    expect(screen.getByDisplayValue("문장 성분 점검표")).toBeTruthy()
    expect(
      (screen.getByLabelText("학습 포인트") as HTMLTextAreaElement).value
    ).toContain("첫 기준")
    expect(
      (screen.getByLabelText("학습 포인트") as HTMLTextAreaElement).value
    ).toContain("둘째 기준")

    fireEvent.change(screen.getByLabelText("예상 시간"), {
      target: { value: "9" },
    })
    fireEvent.change(screen.getByLabelText("학습 포인트"), {
      target: { value: "첫 기준\n수정 기준" },
    })

    expect(onUpdateStepContent).toHaveBeenCalledWith(
      "intro-step",
      "estimatedMinutes",
      9
    )
    expect(onUpdateStepContent).toHaveBeenCalledWith("intro-step", "bullets", [
      "첫 기준",
      "수정 기준",
    ])
  })

  it("renders AI feedback source as a lesson step selector", () => {
    const onUpdateStepContent = vi.fn()

    render(
      <StepWorkspace
        lessonSteps={[
          {
            id: "short-write-step",
            lessonId: "lesson-1",
            type: "SHORT_WRITE",
            title: "짧은 연습",
            sortOrder: 1,
            points: 10,
            required: true,
            status: "active",
            content: {},
          },
          {
            id: "long-write-step",
            lessonId: "lesson-1",
            type: "LONG_WRITE",
            title: "긴 연습",
            sortOrder: 2,
            points: 20,
            required: true,
            status: "active",
            content: {},
          },
        ]}
        onUpdateStepContent={onUpdateStepContent}
        step={{
          id: "feedback-step",
          lessonId: "lesson-1",
          type: "AI_FEEDBACK",
          title: "AI 피드백",
          sortOrder: 3,
          points: 0,
          required: true,
          status: "active",
          content: {
            sourceStepId: "short-write-step",
            feedbackPrompt: "명확성을 평가합니다.",
            focusAreas: ["clarity"],
          },
        }}
      />
    )

    fireEvent.change(screen.getByLabelText("원본 스텝"), {
      target: { value: "long-write-step" },
    })

    expect(onUpdateStepContent).toHaveBeenCalledWith(
      "feedback-step",
      "sourceStepId",
      "long-write-step"
    )
  })

  it("updates boolean field checked state when step content changes", () => {
    const { rerender } = render(
      <StepWorkspace
        lessonSteps={[]}
        step={{
          id: "checklist-step",
          lessonId: "lesson-1",
          type: "CHECKLIST",
          title: "점검표",
          sortOrder: 1,
          points: 10,
          required: true,
          status: "active",
          content: {
            saveResponses: false,
          },
        }}
      />
    )

    expect(
      (screen.getByLabelText("응답 저장") as HTMLInputElement).checked
    ).toBe(false)

    rerender(
      <StepWorkspace
        lessonSteps={[]}
        step={{
          id: "checklist-step",
          lessonId: "lesson-1",
          type: "CHECKLIST",
          title: "점검표",
          sortOrder: 1,
          points: 10,
          required: true,
          status: "active",
          content: {
            saveResponses: true,
          },
        }}
      />
    )

    expect(
      (screen.getByLabelText("응답 저장") as HTMLInputElement).checked
    ).toBe(true)
  })

  it("renders summary point objects without losing their text values", () => {
    render(
      <StepWorkspace
        lessonSteps={[]}
        step={{
          id: "summary-step",
          lessonId: "lesson-1",
          type: "SUMMARY",
          title: "정리",
          sortOrder: 1,
          points: 10,
          required: true,
          status: "active",
          content: {
            points: [
              {
                number: 1,
                text: "주어와 서술어를 먼저 확인합니다.",
              },
            ],
          },
        }}
      />
    )

    expect(
      screen.getByDisplayValue(/주어와 서술어를 먼저 확인합니다\./)
    ).toBeTruthy()
  })
})
