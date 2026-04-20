import { describe, expect, it, vi } from "vitest"

import { getStepCta } from "@/views/session-detail-view/step-registry"
import type { Step, StepState } from "@/views/session-detail-view/types"

function createStep(type: Step["type"]): Step {
  return {
    id: "1",
    type,
    order: 1,
    content:
      type === "WRITING"
        ? {
            type,
            prompt: "글을 써보세요",
            minLength: 1,
            recommendedLength: 10,
            timeLimitSeconds: 0,
          }
        : type === "AI_FEEDBACK"
          ? {
              type,
              targetStepId: "0",
              loadingMessage: "분석 중",
            }
          : {
              type: "MULTIPLE_CHOICE",
              question: "정답을 고르세요",
              options: [{ id: "a", text: "A" }],
              correctOptionIds: ["a"],
              multiSelect: false,
              explanations: { a: "정답" },
            },
    cta: {
      label: "확인",
      variant: "primary",
    },
  }
}

describe("getStepCta", () => {
  it("선택형 스텝은 먼저 확인 상태로 전환한다", () => {
    const updateState = vi.fn()
    const handleNext = vi.fn()
    const step = createStep("MULTIPLE_CHOICE")
    const state: StepState = {
      selected: ["a"],
      hasSelection: true,
      checked: false,
    }

    const cta = getStepCta({
      handleNext,
      isSubmitting: false,
      state,
      step,
      updateState,
    })

    expect(cta.label).toBe("확인")
    expect(cta.enabled).toBe(true)
    cta.action()
    expect(updateState).toHaveBeenCalledWith({
      selected: ["a"],
      hasSelection: true,
      checked: true,
    })
    expect(handleNext).not.toHaveBeenCalled()
  })

  it("입력형 스텝은 입력이 있을 때만 다음으로 진행한다", () => {
    const handleNext = vi.fn()

    const cta = getStepCta({
      handleNext,
      isSubmitting: false,
      state: {
        text: "초안",
        hasInput: true,
      },
      step: createStep("WRITING"),
      updateState: vi.fn(),
    })

    expect(cta.enabled).toBe(true)
    cta.action()
    expect(handleNext).toHaveBeenCalled()
  })

  it("AI 스텝은 완료 전까지 CTA를 비활성화한다", () => {
    const cta = getStepCta({
      handleNext: vi.fn(),
      isSubmitting: false,
      state: {
        stepOrder: 2,
        kind: "feedback",
        status: "pending",
        sourceStepOrder: 1,
        attemptCount: 0,
        resultJson: null,
        errorMessage: null,
        updatedAt: "2026-04-21T00:00:00.000Z",
      },
      step: createStep("AI_FEEDBACK"),
      updateState: vi.fn(),
    })

    expect(cta.enabled).toBe(false)
  })
})
