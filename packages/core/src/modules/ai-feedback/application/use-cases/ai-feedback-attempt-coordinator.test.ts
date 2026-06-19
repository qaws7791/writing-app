import { describe, expect, it } from "vitest"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@/modules/content/domain/content.ids"
import { learnerIdSchema } from "@/modules/learning/domain/learning.ids"
import {
  createAiFeedbackAttemptCoordinator,
  type AiFeedbackAttemptCoordinator,
} from "@/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import { defaultAiFeedbackAttemptPolicy } from "@/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type {
  AiFeedbackAttemptRecord,
  AiFeedbackRepository,
} from "@/modules/ai-feedback/application/ports/ai-feedback.repository"
import type {
  AiFeedbackProvider,
  AiFeedbackProviderInput,
} from "@/modules/ai-feedback/application/ports/ai-feedback.provider"
import { err, ok } from "@/shared/result"

const occurredAt = new Date("2026-06-14T10:00:00.000Z")
const learnerId = learnerIdSchema.parse("user-1")
const lessonId = lessonIdSchema.parse("l1")
const stepId = lessonStepIdSchema.parse("l1-s2")
const command = {
  answer: "문장을 더 분명하게 고쳐 보았습니다.",
  lessonId,
  occurredAt,
  stepId,
  userId: learnerId,
}
const context = {
  focus: "명확성",
  lessonTitle: "좋은 문장이란 무엇인가",
}

describe("AI 피드백 시도 coordinator", () => {
  it("provider 결과를 Kwep AI 코칭 응답 DTO로 정렬하고 저장한다", async () => {
    const savedAttempts: AiFeedbackAttemptRecord[] = []
    const providerInputs: AiFeedbackProviderInput[] = []
    const coordinator = createCoordinator({
      completedAttempts: 1,
      providerInputs,
      savedAttempts,
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      kind: "ok",
      value: {
        improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
        nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
        remainingAttempts: 1,
        score: 82,
        scoreRange: [0, 100],
        showScore: true,
        strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
        summary: "문장의 의도가 분명합니다.",
      },
    })

    expect(providerInputs).toEqual([
      {
        input: [
          "레슨 제목: 좋은 문장이란 무엇인가",
          "코칭 초점: 명확성",
          "학습자 답변:",
          "문장을 더 분명하게 고쳐 보았습니다.",
        ].join("\n"),
        instructions: [
          "당신은 한국어 글쓰기 학습자를 돕는 코치입니다.",
          "답변은 반드시 JSON schema에 맞춰 한국어로 작성합니다.",
          "칭찬은 구체적으로, 개선점은 다음 시도에서 바로 적용할 수 있게 씁니다.",
          "점수는 0부터 100 사이 정수로 판단합니다.",
        ].join("\n"),
        policyVersion: "kwep-writing-coach-v1",
      },
    ])
    expect(savedAttempts).toEqual([
      {
        ...command,
        attemptNumber: 2,
        result: {
          improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
          nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
          score: 82,
          scoreRange: [0, 100],
          showScore: true,
          strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
          summary: "문장의 의도가 분명합니다.",
        },
      },
    ])
  })

  it("완료된 시도가 한도에 도달하면 provider 호출과 저장을 건너뛴다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const savedAttempts: AiFeedbackAttemptRecord[] = []
    const coordinator = createCoordinator({
      completedAttempts: 3,
      providerInputs,
      savedAttempts,
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      kind: "err",
      error: {
        kind: "attempt-limit-exceeded",
        remainingAttempts: 0,
      },
    })
    expect(providerInputs).toEqual([])
    expect(savedAttempts).toEqual([])
  })

  it("주입된 시도 정책으로 저장 한도와 남은 횟수를 계산한다", async () => {
    const saveMaxAttempts: number[] = []
    const coordinator = createCoordinator({
      attemptPolicy: {
        maxCompletedAttempts: 1,
      },
      saveMaxAttempts,
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      kind: "ok",
      value: {
        improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
        nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
        remainingAttempts: 0,
        score: 82,
        scoreRange: [0, 100],
        showScore: true,
        strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
        summary: "문장의 의도가 분명합니다.",
      },
    })
    expect(saveMaxAttempts).toEqual([1])
  })

  it("저장 시점에 시도 한도를 넘으면 제한 오류를 반환한다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const savedAttempts: AiFeedbackAttemptRecord[] = []
    const coordinator = createCoordinator({
      completedAttempts: 2,
      providerInputs,
      saveResult: {
        completedAttempts: 3,
        kind: "limit-exceeded",
      },
      savedAttempts,
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      kind: "err",
      error: {
        kind: "attempt-limit-exceeded",
        remainingAttempts: 0,
      },
    })
    expect(providerInputs).toHaveLength(1)
    expect(savedAttempts).toEqual([])
  })

  it("provider 실패는 저장하지 않고 시도 횟수를 소모하지 않는다", async () => {
    const savedAttempts: AiFeedbackAttemptRecord[] = []
    const providerInputs: AiFeedbackProviderInput[] = []
    const coordinator = createCoordinator({
      completedAttempts: 2,
      providerInputs,
      providerResult: err({ kind: "provider-unavailable" }),
      savedAttempts,
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      kind: "err",
      error: {
        kind: "provider-failed",
        remainingAttempts: 1,
      },
    })
    expect(providerInputs).toHaveLength(1)
    expect(savedAttempts).toEqual([])
  })
})

function createCoordinator({
  completedAttempts = 0,
  attemptPolicy = defaultAiFeedbackAttemptPolicy,
  providerInputs = [],
  providerResult = ok({
    improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
    nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
    score: 82,
    scoreRange: [0, 100] as const,
    showScore: true,
    strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
    summary: "문장의 의도가 분명합니다.",
  }),
  saveResult,
  saveMaxAttempts = [],
  savedAttempts = [],
}: {
  readonly completedAttempts?: number
  readonly attemptPolicy?: Parameters<
    typeof createAiFeedbackAttemptCoordinator
  >[0]["attemptPolicy"]
  readonly providerInputs?: AiFeedbackProviderInput[]
  readonly providerResult?: Awaited<
    ReturnType<AiFeedbackProvider["createFeedback"]>
  >
  readonly saveResult?: Awaited<
    ReturnType<AiFeedbackRepository["saveCompletedAttempt"]>
  >
  readonly saveMaxAttempts?: number[]
  readonly savedAttempts?: AiFeedbackAttemptRecord[]
} = {}): AiFeedbackAttemptCoordinator {
  const feedbackRepository: AiFeedbackRepository = {
    async countCompletedAttempts() {
      return completedAttempts
    },
    async saveCompletedAttempt(record, maxAttempts) {
      saveMaxAttempts.push(maxAttempts)
      const attemptNumber =
        saveResult?.kind === "saved"
          ? saveResult.attemptNumber
          : completedAttempts + savedAttempts.length + 1

      if (saveResult?.kind === "limit-exceeded") {
        return saveResult
      }

      savedAttempts.push({
        ...record,
        attemptNumber,
      })

      return saveResult ?? { attemptNumber, kind: "saved" }
    },
  }
  const provider: AiFeedbackProvider = {
    async createFeedback(input) {
      providerInputs.push(input)
      return providerResult
    },
  }

  return createAiFeedbackAttemptCoordinator({
    attemptPolicy,
    feedbackRepository,
    provider,
  })
}
