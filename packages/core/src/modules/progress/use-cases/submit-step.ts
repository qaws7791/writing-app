import { ResultAsync } from "neverthrow"

import type { DomainError } from "../../../shared/error/index"
import { createValidationError } from "../../../shared/error/index"
import type { SessionId, UserId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { StepSummary } from "../../journeys/journey-types"
import type { ProgressRepository } from "../progress-port"
import type { SessionRuntime } from "../progress-types"
import { buildSessionRuntime } from "./build-session-runtime"

export type SubmitStepDeps = {
  readonly progressRepository: ProgressRepository
  readonly journeyRepository: JourneyRepository
}

export type SubmitStepInput = {
  readonly stepOrder: number
  readonly response: unknown
}

export type SubmitStepResult = {
  readonly acceptedAi: boolean
  readonly runtime: SessionRuntime
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDomainError(error: unknown): error is DomainError {
  return (
    isRecord(error) &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  )
}

function extractTextResponse(response: unknown): string | null {
  if (typeof response === "string") {
    const trimmed = response.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (!isRecord(response) || typeof response.text !== "string") {
    return null
  }

  const trimmed = response.text.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getContent(step: StepSummary): Record<string, unknown> {
  const contentJson = isRecord(step.contentJson) ? step.contentJson : {}
  const content = contentJson.content
  return isRecord(content) ? content : {}
}

function resolveAiKind(step: StepSummary): "comparison" | "feedback" {
  const payload = isRecord(step.contentJson) ? step.contentJson : {}
  return payload.type === "AI_COMPARISON" ? "comparison" : "feedback"
}

function normalizeError(error: unknown): DomainError {
  if (isDomainError(error)) {
    return error
  }

  return createValidationError("세션 스텝을 처리하지 못했습니다.", "session")
}

export function makeSubmitStepUseCase(deps: SubmitStepDeps) {
  return (
    userId: UserId,
    sessionId: SessionId,
    input: SubmitStepInput
  ): ResultAsync<SubmitStepResult, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const [progress, session] = await Promise.all([
          deps.progressRepository.getSessionProgress(userId, sessionId),
          deps.journeyRepository.getSessionDetail(sessionId),
        ])

        if (session === null) {
          throw createValidationError("세션을 찾을 수 없습니다.", "session")
        }

        const current = progress?.stepResponsesJson ?? {}
        const updated = {
          ...current,
          [String(input.stepOrder)]: input.response,
        }

        const currentStep = session.steps.find(
          (step) => step.order === input.stepOrder
        )
        if (!currentStep) {
          throw createValidationError("제출할 수 없는 스텝입니다.", "stepOrder")
        }

        const nextStep = session.steps.find(
          (step) => step.order === input.stepOrder + 1
        )
        const isNextStepLast =
          nextStep !== undefined &&
          !session.steps.some((s) => s.order > nextStep.order)
        const shouldTriggerAi =
          (currentStep.type === "write" || currentStep.type === "revise") &&
          nextStep?.type === "feedback"

        if (shouldTriggerAi && nextStep) {
          const kind = resolveAiKind(nextStep)
          const submittedText = extractTextResponse(input.response)

          if (submittedText === null) {
            throw createValidationError(
              "AI 분석을 위해 텍스트 응답이 필요합니다.",
              "response"
            )
          }

          const aiInput =
            kind === "comparison"
              ? (() => {
                  const content = getContent(currentStep)
                  const originalStepId = content.originalWritingStepId
                  const originalResponse =
                    typeof originalStepId === "string"
                      ? updated[originalStepId]
                      : undefined
                  const originalText = extractTextResponse(originalResponse)

                  if (originalText === null) {
                    throw createValidationError(
                      "비교 분석을 위한 초안이 없습니다.",
                      "response"
                    )
                  }

                  return {
                    originalText,
                    revisedText: submittedText,
                  }
                })()
              : {
                  bodyPlainText: submittedText,
                  level: "beginner",
                }

          await Promise.all([
            deps.progressRepository.updateSessionProgress(userId, sessionId, {
              currentStepOrder: nextStep.order,
              stepResponsesJson: updated,
            }),
            deps.progressRepository.saveSessionStepAiState(
              userId,
              sessionId,
              nextStep.order,
              {
                kind,
                sourceStepOrder: input.stepOrder,
                status: "pending",
                attemptCount: 0,
                inputJson: aiInput,
                resultJson: null,
                errorMessage: null,
              }
            ),
          ])
        } else if (isNextStepLast) {
          const journey = await deps.journeyRepository.getById(
            session.journeyId
          )
          if (!journey) {
            throw createValidationError(
              "여정 정보를 찾을 수 없습니다.",
              "session"
            )
          }
          const nextSessionOrder = session.order + 1
          const completionRate = Math.min(
            1,
            nextSessionOrder / journey.sessionCount
          )
          await Promise.all([
            deps.progressRepository.updateSessionProgress(userId, sessionId, {
              currentStepOrder: input.stepOrder + 1,
              stepResponsesJson: updated,
              status: "completed",
            }),
            deps.progressRepository.updateJourneyProgress(
              userId,
              session.journeyId,
              {
                currentSessionOrder: nextSessionOrder,
                completionRate,
                status:
                  nextSessionOrder > journey.sessionCount
                    ? "completed"
                    : "in_progress",
              }
            ),
          ])
        } else {
          await deps.progressRepository.updateSessionProgress(
            userId,
            sessionId,
            {
              currentStepOrder: input.stepOrder + 1,
              stepResponsesJson: updated,
            }
          )
        }

        const runtime = await buildSessionRuntime({
          journeyRepository: deps.journeyRepository,
          progressRepository: deps.progressRepository,
          sessionId,
          userId,
        })

        return {
          acceptedAi: shouldTriggerAi,
          runtime,
        }
      })(),
      normalizeError
    )
}
