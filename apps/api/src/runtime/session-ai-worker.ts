import {
  comparisonSessionStepAiStateSchema,
  feedbackSessionStepAiStateSchema,
  type ProgressRepository,
} from "@workspace/core/modules/progress"
import type { AiCoachingGateway } from "@workspace/core/modules/ai-feedback"
import type { AppLogger } from "@workspace/logging"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "AI 작업 처리 중 오류가 발생했습니다."
}

const INVALID_AI_RESULT_MESSAGE =
  "AI 응답 형식이 올바르지 않아 결과를 저장하지 못했습니다."

type StepProcessingResult = "failed" | "skipped" | "succeeded"

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
  logger: AppLogger
  pollMs?: number
  progressRepository: ProgressRepository
}) {
  const batchSize = input.batchSize ?? 8
  const pollMs = input.pollMs ?? 750
  const inFlight = new Set<string>()
  let isRunning = false
  let isStarted = false
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearScheduledTick() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleNextTick() {
    if (!isStarted) {
      return
    }

    clearScheduledTick()
    timer = setTimeout(() => {
      void tickAndSchedule()
    }, pollMs)
  }

  async function processPendingStep(
    step: Awaited<
      ReturnType<ProgressRepository["listPendingSessionStepAiStates"]>
    >[number]
  ): Promise<StepProcessingResult> {
    const startedAt = performance.now()
    const key = toWorkerKey(step)
    if (inFlight.has(key)) {
      return "skipped"
    }

    inFlight.add(key)

    try {
      const claimed =
        await input.progressRepository.claimPendingSessionStepAiState({
          userId: step.userId,
          sessionId: step.sessionId,
          stepOrder: step.stepOrder,
          updatedAt: step.updatedAt,
        })

      if (!claimed) {
        return "skipped"
      }

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
      const resultJsonSchema =
        step.kind === "feedback"
          ? feedbackSessionStepAiStateSchema.shape.resultJson
          : comparisonSessionStepAiStateSchema.shape.resultJson
      const parsedResult = resultJsonSchema.safeParse(resolved)

      if (!parsedResult.success || parsedResult.data === null) {
        input.logger.warn(
          {
            issues: parsedResult.success ? [] : parsedResult.error.issues,
            attemptCount,
            durationMs: Math.round(performance.now() - startedAt),
            kind: step.kind,
            scope: "session-ai-worker",
            sessionId: step.sessionId,
            stepOrder: step.stepOrder,
            userId: step.userId,
          },
          "session ai result validation failed"
        )

        await input.progressRepository.saveSessionStepAiState(
          step.userId,
          step.sessionId,
          step.stepOrder,
          {
            kind: step.kind,
            sourceStepOrder: step.sourceStepOrder,
            status: "failed",
            attemptCount,
            inputJson: step.inputJson,
            resultJson: null,
            errorMessage: INVALID_AI_RESULT_MESSAGE,
          }
        )

        return "failed"
      }

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
          resultJson: parsedResult.data,
          errorMessage: null,
        }
      )

      input.logger.info(
        {
          attemptCount,
          durationMs: Math.round(performance.now() - startedAt),
          kind: step.kind,
          scope: "session-ai-worker",
          sessionId: step.sessionId,
          stepOrder: step.stepOrder,
          userId: step.userId,
        },
        "session ai work succeeded"
      )

      return "succeeded"
    } catch (error) {
      input.logger.warn(
        {
          attemptCount: step.attemptCount + 1,
          durationMs: Math.round(performance.now() - startedAt),
          err: error,
          kind: step.kind,
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

      return "failed"
    } finally {
      inFlight.delete(key)
    }
  }

  async function tick() {
    if (isRunning) {
      return
    }

    isRunning = true

    try {
      const startedAt = performance.now()
      const pendingSteps =
        await input.progressRepository.listPendingSessionStepAiStates(batchSize)

      if (pendingSteps.length === 0) {
        return
      }

      const results = await Promise.all(
        pendingSteps.map((pendingStep) => processPendingStep(pendingStep))
      )

      const processedCount = results.filter(
        (result) => result !== "skipped"
      ).length
      const succeededCount = results.filter(
        (result) => result === "succeeded"
      ).length
      const failedCount = results.filter((result) => result === "failed").length

      input.logger.info(
        {
          durationMs: Math.round(performance.now() - startedAt),
          failedCount,
          pendingCount: pendingSteps.length,
          processedCount,
          scope: "session-ai-worker",
          succeededCount,
        },
        "session ai worker tick completed"
      )
    } catch (error) {
      input.logger.error(
        {
          err: error,
          scope: "session-ai-worker",
        },
        "session ai worker tick failed"
      )
    } finally {
      isRunning = false
    }
  }

  async function tickAndSchedule() {
    await tick()

    if (isStarted) {
      scheduleNextTick()
    }
  }

  return {
    start() {
      if (isStarted) {
        return
      }

      isStarted = true
      void tickAndSchedule()
    },
    stop() {
      isStarted = false
      clearScheduledTick()
    },
    tick,
  }
}
