import { describe, expect, it } from "vitest"

import {
  deserializeStepResponses,
  serializeStepResponse,
} from "@/features/sessions/session-step-response"
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
            prompt: "테스트 프롬프트",
            minLength: 1,
            recommendedLength: 10,
            timeLimitSeconds: 0,
          }
        : type === "SHORT_ANSWER"
          ? {
              type,
              question: "테스트 질문",
              minLength: 1,
              maxLength: 100,
            }
          : type === "REWRITING"
            ? {
                type,
                instruction: "다시 써보세요",
                originalWritingStepId: "0",
                feedbackStepId: "2",
              }
            : type === "MULTIPLE_CHOICE"
              ? {
                  type,
                  question: "정답을 고르세요",
                  options: [{ id: "a", text: "A" }],
                  correctOptionIds: ["a"],
                  multiSelect: false,
                  explanations: { a: "정답" },
                }
              : {
                  type: "INTRO",
                  title: "세션 소개",
                  description: "설명",
                  estimatedMinutes: 10,
                },
    cta: {
      label: "다음",
      variant: "primary",
    },
  }
}

describe("serializeStepResponse", () => {
  it("선택/입력 스텝만 제출용 응답으로 직렬화한다", () => {
    const multipleChoiceState: StepState = {
      selected: ["a"],
      hasSelection: true,
      checked: true,
    }
    const writingState: StepState = {
      text: "글 내용",
      hasInput: true,
    }

    expect(
      serializeStepResponse(createStep("MULTIPLE_CHOICE"), multipleChoiceState)
    ).toEqual({
      type: "MULTIPLE_CHOICE",
      selected: ["a"],
    })
    expect(serializeStepResponse(createStep("WRITING"), writingState)).toEqual({
      type: "WRITING",
      text: "글 내용",
    })
  })

  it("안내/AI 스텝과 AI 상태는 제출하지 않는다", () => {
    const aiState: StepState = {
      kind: "feedback",
      status: "succeeded",
      sourceStepOrder: 1,
      attemptCount: 1,
      resultJson: null,
      errorMessage: null,
      updatedAt: "2026-04-20T00:00:00.000Z",
    }

    expect(
      serializeStepResponse(createStep("INTRO"), undefined)
    ).toBeUndefined()
    expect(serializeStepResponse(createStep("INTRO"), aiState)).toBeUndefined()
  })
})

describe("deserializeStepResponses", () => {
  it("서버 응답을 UI 상태로 복원하면서 플래그를 재구성한다", () => {
    const states = deserializeStepResponses({
      "1": {
        type: "MULTIPLE_CHOICE",
        selected: ["a"],
      },
      "2": {
        type: "WRITING",
        text: "저장된 글",
      },
    })

    expect(states["1"]).toEqual({
      selected: ["a"],
      hasSelection: true,
      checked: true,
    })
    expect(states["2"]).toEqual({
      text: "저장된 글",
      hasInput: true,
    })
  })
})
