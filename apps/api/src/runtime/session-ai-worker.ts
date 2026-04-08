import type { AiCoachingGateway, ProgressRepository } from "@workspace/core"

import type { ApiLogger } from "../observability/logger"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "AI 작업 처리 중 오류가 발생했습니다."
}

function toWorkerKey(input: {
  userId: string
  sessionId: number
  stepOrder: number
}) {
  return `${input.userId}:${input.sessionId}:${input.stepOrder}`
}

function isComparisonInput(input: Record<string, unknown>): input is {
  originalText: string
  revisedText: string
} {
  return (
    typeof input.originalText === "string" &&
    typeof input.revisedText === "string"
  )
}

function isFeedbackInput(input: Record<string, unknown>): input is {
  bodyPlainText: string
  level?: "advanced" | "beginner" | "intermediate"
} {
  return typeof input.bodyPlainText === "string"
}

export function createSessionAiWorker(input: {
  aiCoachingGateway: AiCoachingGateway
  batchSize?: number
  logger: ApiLogger
  pollMs?: number
  progressRepository: ProgressRepository
}) {
  const batchSize = input.batchSize ?? 8
  const pollMs = input.pollMs ?? 750
  const inFlight = new Set<string>()
  let timer: ReturnType<typeof setInterval> | null = null

  async function processPendingStep(
    step: Awaited<
      ReturnType<ProgressRepository["listPendingSessionStepAiStates"]>
    >[number]
  ) {
    const key = toWorkerKey(step)
    if (inFlight.has(key)) {
      return
    }

    inFlight.add(key)

    try {
      const attemptCount = step.attemptCount + 1

      await input.progressRepository.saveSessionStepAiState(
        step.userId,
        step.sessionId,
        step.stepOrder,
        {
          kind: step.kind,
          sourceStepOrder: step.sourceStepOrder,
          status: "pending",
          attemptCount,
          inputJson: step.inputJson,
          resultJson: null,
          errorMessage: null,
        }
      )

      const taskInput = isRecord(step.inputJson) ? step.inputJson : {}

      const result =
        step.kind === "comparison"
          ? (() => {
              if (!isComparisonInput(taskInput)) {
                throw new Error("비교 분석 입력이 올바르지 않습니다.")
              }

              return input.aiCoachingGateway.compareRevisions(taskInput)
            })()
          : (() => {
              if (!isFeedbackInput(taskInput)) {
                throw new Error("피드백 입력이 올바르지 않습니다.")
              }

              return input.aiCoachingGateway.generateFeedback({
                bodyPlainText: taskInput.bodyPlainText,
                level: taskInput.level ?? "beginner",
              })
            })()

      const resolved = await result

      await input.progressRepository.saveSessionStepAiState(
        step.userId,
        step.sessionId,
        step.stepOrder,
        {
          kind: step.kind,
          sourceStepOrder: step.sourceStepOrder,
          status: "succeeded",
          attemptCount,
          inputJson: step.inputJson,
          resultJson: resolved as Record<string, unknown>,
          errorMessage: null,
        }
      )
    } catch (error) {
      input.logger.warn(
        {
          err: error,
          scope: "session-ai-worker",
          sessionId: step.sessionId,
          stepOrder: step.stepOrder,
          userId: step.userId,
        },
        "session ai work failed"
      )

      await input.progressRepository.saveSessionStepAiState(
        step.userId,
        step.sessionId,
        step.stepOrder,
        {
          kind: step.kind,
          sourceStepOrder: step.sourceStepOrder,
          status: "failed",
          attemptCount: step.attemptCount + 1,
          inputJson: step.inputJson,
          resultJson: null,
          errorMessage: getErrorMessage(error),
        }
      )
    } finally {
      inFlight.delete(key)
    }
  }

  async function tick() {
    try {
      const pendingSteps =
        await input.progressRepository.listPendingSessionStepAiStates(batchSize)

      if (pendingSteps.length === 0) {
        return
      }

      await Promise.all(
        pendingSteps.map((pendingStep) => processPendingStep(pendingStep))
      )
    } catch (error) {
      input.logger.error(
        {
          err: error,
          scope: "session-ai-worker",
        },
        "session ai worker tick failed"
      )
    }
  }

  return {
    start() {
      if (timer !== null) {
        return
      }

      timer = setInterval(() => {
        void tick()
      }, pollMs)

      void tick()
    },
    stop() {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    },
    tick,
  }
}
