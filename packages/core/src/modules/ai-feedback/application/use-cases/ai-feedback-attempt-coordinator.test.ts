import { describe, expect, it } from "vitest"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "#core/modules/content/domain/content.ids"
import { learnerIdSchema } from "#core/modules/learning/domain/learning.ids"
import {
  createAiFeedbackAttemptCoordinator,
  type AiFeedbackAttemptTransitionEvent,
} from "#core/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import { defaultAiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import { err, ok } from "#core/shared/result"
import type { AiFeedbackPayload } from "#core/modules/ai-feedback/domain/ai-feedback.dto"

const occurredAt = new Date("2026-06-14T10:00:00.000Z")
const command = {
  answer: "문장을 더 분명하게 고쳐 보았습니다.",
  idempotencyKey: "request-1",
  lessonId: lessonIdSchema.parse("l1"),
  occurredAt,
  stepId: lessonStepIdSchema.parse("l1-s2"),
  userId: learnerIdSchema.parse("user-1"),
}
const context = {
  focus: "명확성",
  lessonTitle: "좋은 문장이란 무엇인가",
}

describe("AI 피드백 시도 coordinator", () => {
  it("slot을 먼저 예약하고 성공 상태와 구조 이벤트를 남긴다", async () => {
    const transitions: AiFeedbackAttemptTransitionEvent[] = []
    let succeeded = false
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      createAttemptId: () => "attempt-1",
      feedbackRepository: repository({
        markSucceeded() {
          succeeded = true
        },
      }),
      onAttemptTransition: (event) => transitions.push(event),
      provider: {
        async createFeedback() {
          return ok(feedbackPayload)
        },
      },
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      kind: "ok",
      value: { ...feedbackPayload, remainingAttempts: 2 },
    })
    expect(succeeded).toBe(true)
    expect(transitions).toEqual([
      expect.objectContaining({
        attemptId: "attempt-1",
        fromStatus: null,
        reason: "reserved",
        toStatus: "pending",
      }),
      expect.objectContaining({
        attemptId: "attempt-1",
        fromStatus: "pending",
        reason: "provider-succeeded",
        toStatus: "succeeded",
      }),
    ])
  })

  it("provider fault를 failed로 전이하고 slot을 소모하지 않는다", async () => {
    let failed = false
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      feedbackRepository: repository({
        markFailed() {
          failed = true
        },
      }),
      provider: {
        async createFeedback() {
          return err({ kind: "provider-unavailable" })
        },
      },
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      error: { kind: "provider-failed", remainingAttempts: 3 },
      kind: "err",
    })
    expect(failed).toBe(true)
  })

  it("provider timeout을 failed로 전이한다", async () => {
    let failed = false
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: {
        maxCompletedAttempts: 3,
        pendingTtlMs: 100,
        providerTimeoutMs: 10,
      },
      feedbackRepository: repository({
        markFailed() {
          failed = true
        },
      }),
      provider: {
        async createFeedback() {
          return new Promise(() => undefined)
        },
      },
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      error: { kind: "provider-failed", remainingAttempts: 3 },
      kind: "err",
    })
    expect(failed).toBe(true)
  })

  it("만료 회수와 pending 거절 상태를 구조 이벤트 및 오류로 노출한다", async () => {
    const transitions: AiFeedbackAttemptTransitionEvent[] = []
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      feedbackRepository: repository({
        reservation: {
          completedAttempts: 1,
          expiredAttempts: [{ attemptId: "expired-1", attemptNumber: 2 }],
          kind: "in-progress",
        },
      }),
      onAttemptTransition: (event) => transitions.push(event),
      provider: {
        async createFeedback() {
          return ok(feedbackPayload)
        },
      },
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual({
      error: { kind: "attempt-in-progress", remainingAttempts: 2 },
      kind: "err",
    })
    expect(transitions).toEqual([
      expect.objectContaining({
        attemptId: "expired-1",
        reason: "ttl-expired",
        toStatus: "expired",
      }),
    ])
  })
})

const feedbackPayload: AiFeedbackPayload = {
  improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
  nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
  score: 82,
  scoreRange: [0, 100],
  showScore: true,
  strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
  summary: "문장의 의도가 분명합니다.",
}

function repository(
  options: {
    readonly markFailed?: () => void
    readonly markSucceeded?: () => void
    readonly reservation?: Awaited<
      ReturnType<AiFeedbackRepository["reserveAttempt"]>
    >
  } = {}
): AiFeedbackRepository {
  return {
    async markAttemptFailed() {
      options.markFailed?.()
      return true
    },
    async markAttemptSucceeded() {
      options.markSucceeded?.()
      return true
    },
    async reserveAttempt(input) {
      return (
        options.reservation ?? {
          attemptId: input.attemptId,
          attemptNumber: 1,
          completedAttempts: 0,
          expiredAttempts: [],
          kind: "reserved",
        }
      )
    },
  }
}
