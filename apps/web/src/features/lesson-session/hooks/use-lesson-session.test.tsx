import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useLessonSession } from "@/features/lesson-session/hooks/use-lesson-session"
import { toLessonViewModel } from "@/features/lesson-session/model/lesson-view-model"
import { createLearnerLessonWireFixture } from "@/test/learner-api-fixtures"

vi.mock("@/shared/http/use-unmount-abort-signal", () => ({
  useUnmountAbortSignal: () => new AbortController().signal,
}))

describe("useLessonSession", () => {
  it("MULTIPLE_CHOICE 스텝에서 답안 선택 시 즉시 채점되고 checked 상태가 된다", () => {
    const lesson = toLessonViewModel(
      createLearnerLessonWireFixture({
        learning: {
          completedSteps: 0,
          currentStepId: "step-mc",
          currentStepIndex: 0,
          progressPercent: 0,
          status: "in_progress",
          totalSteps: 1,
          version: {
            curriculumVersionId: "fixture-curriculum-v1",
            revision: 1,
          },
        },
        steps: [
          {
            correct: "opt-1",
            explanation: "정답 설명입니다",
            id: "step-mc",
            options: [
              { id: "opt-1", text: "정답 보기" },
              { id: "opt-2", text: "오답 보기" },
            ],
            question: "문항 질문",
            sortOrder: 1,
            type: "MULTIPLE_CHOICE",
          },
        ],
      })
    )

    const { result } = renderHook(() => useLessonSession({ lesson }))

    expect(result.current.checked).toBe(false)

    act(() => {
      result.current.saveAnswer({
        payload: {
          selectedOptionId: "opt-1",
          type: "MULTIPLE_CHOICE",
        },
        stepId: "step-mc",
      })
    })

    expect(result.current.checked).toMatchObject({
      correct: true,
      explanation: "정답 설명입니다",
    })
  })

  it("TRUE_FALSE 스텝에서 답안 선택 시 즉시 채점된다", () => {
    const lesson = toLessonViewModel(
      createLearnerLessonWireFixture({
        learning: {
          completedSteps: 0,
          currentStepId: "step-tf",
          currentStepIndex: 0,
          progressPercent: 0,
          status: "in_progress",
          totalSteps: 1,
          version: {
            curriculumVersionId: "fixture-curriculum-v1",
            revision: 1,
          },
        },
        steps: [
          {
            correct: true,
            explanation: "참 설명입니다",
            id: "step-tf",
            question: "참인가요 거짓인가요?",
            sortOrder: 1,
            statement: "명제입니다",
            type: "TRUE_FALSE",
          },
        ],
      })
    )

    const { result } = renderHook(() => useLessonSession({ lesson }))

    expect(result.current.checked).toBe(false)

    act(() => {
      result.current.saveAnswer({
        payload: {
          selectedAnswer: false,
          type: "TRUE_FALSE",
        },
        stepId: "step-tf",
      })
    })

    expect(result.current.checked).toMatchObject({
      correct: false,
      explanation: "참 설명입니다",
    })
  })

  it("CATEGORIZE 등 manual 스텝에서는 saveAnswer 후에도 checked가 false로 유지되고 submitCurrentStep으로 채점된다", () => {
    const lesson = toLessonViewModel(
      createLearnerLessonWireFixture({
        learning: {
          completedSteps: 0,
          currentStepId: "step-cg",
          currentStepIndex: 0,
          progressPercent: 0,
          status: "in_progress",
          totalSteps: 1,
          version: {
            curriculumVersionId: "fixture-curriculum-v1",
            revision: 1,
          },
        },
        steps: [
          {
            categories: [{ id: "cat-1", text: "분류 1" }],
            explanation: "분류 설명",
            id: "step-cg",
            items: [{ categoryId: "cat-1", id: "item-1", text: "항목 1" }],
            sortOrder: 1,
            title: "분류 제목",
            type: "CATEGORIZE",
          },
        ],
      })
    )

    const { result } = renderHook(() => useLessonSession({ lesson }))

    expect(result.current.checked).toBe(false)

    act(() => {
      result.current.saveAnswer({
        payload: {
          assignments: [{ categoryId: "cat-1", itemId: "item-1" }],
          type: "CATEGORIZE",
        },
        stepId: "step-cg",
      })
    })

    // saveAnswer 직후에는 아직 checked가 false여야 함
    expect(result.current.checked).toBe(false)
    expect(result.current.isReady).toBe(true)

    // 명시적으로 submitCurrentStep을 호출해야 checked 상태로 전환됨
    act(() => {
      result.current.submitCurrentStep()
    })

    expect(result.current.checked).toMatchObject({
      correct: true,
      explanation: "분류 설명",
    })
  })
})
