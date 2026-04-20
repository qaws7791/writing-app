import { ResultAsync } from "neverthrow"

import type { DomainError } from "../../../shared/error/index"
import { createValidationError } from "../../../shared/error/index"
import type { SessionId, UserId } from "../../../shared/brand/index"
import type { RepositoryTransactionManager } from "../../../shared/transaction/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type {
  SessionStepContentType,
  StepSummary,
} from "../../journeys/journey-types"
import type { ProgressRepository } from "../progress-port"
import type {
  SessionRuntime,
  StepResponse,
  StepResponseMap,
} from "../progress-types"
import { buildSessionRuntime } from "./build-session-runtime"

export type SubmitStepDeps = {
  readonly progressRepository: ProgressRepository
  readonly journeyRepository: JourneyRepository
  readonly transactionManager: RepositoryTransactionManager
}

export type SubmitStepInput = {
  readonly stepOrder: number
  readonly response?: StepResponse
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

function extractTextResponse(
  response: StepResponse | undefined
): string | null {
  if (
    response === undefined ||
    (response.type !== "SHORT_ANSWER" &&
      response.type !== "WRITING" &&
      response.type !== "REWRITING")
  ) {
    return null
  }

  const trimmed = response.text.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getContent(step: StepSummary): Record<string, unknown> {
  return step.contentJson.content
}

function resolveAiKind(step: StepSummary): "comparison" | "feedback" {
  return step.contentJson.content.type === "AI_COMPARISON"
    ? "comparison"
    : "feedback"
}

function resolveExpectedResponseType(
  step: StepSummary
): StepResponse["type"] | null {
  const payloadType: SessionStepContentType =
    step.contentJson.type ?? step.contentJson.content.type

  switch (payloadType) {
    case "MULTIPLE_CHOICE":
    case "FILL_IN_THE_BLANK":
    case "ORDERING":
    case "HIGHLIGHT":
    case "SHORT_ANSWER":
    case "WRITING":
    case "REWRITING":
      return payloadType
    default:
      return null
  }
}

function validateStepResponse(
  step: StepSummary,
  response: StepResponse | undefined
): StepResponse | undefined {
  const expectedResponseType = resolveExpectedResponseType(step)

  if (expectedResponseType === null) {
    if (response !== undefined) {
      throw createValidationError(
        "응답을 제출할 수 없는 스텝입니다.",
        "response"
      )
    }

    return undefined
  }

  if (response === undefined || response.type !== expectedResponseType) {
    throw createValidationError(
      "현재 스텝 타입과 맞지 않는 응답입니다.",
      "response"
    )
  }

  return response
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
        const shouldTriggerAi = await deps.transactionManager.run(
          async ({ journeyRepository, progressRepository }) => {
            const [progress, session] = await Promise.all([
              progressRepository.getSessionProgress(userId, sessionId),
              journeyRepository.getSessionDetail(sessionId),
            ])

            if (session === null) {
              throw createValidationError("세션을 찾을 수 없습니다.", "session")
            }

            const currentStep = session.steps.find(
              (step) => step.order === input.stepOrder
            )
            if (!currentStep) {
              throw createValidationError(
                "제출할 수 없는 스텝입니다.",
                "stepOrder"
              )
            }

            const current = progress?.stepResponsesJson ?? {}
            const validatedResponse = validateStepResponse(
              currentStep,
              input.response
            )
            const updated: StepResponseMap =
              validatedResponse === undefined
                ? current
                : {
                    ...current,
                    [String(input.stepOrder)]: validatedResponse,
                  }

            const nextStep = session.steps.find(
              (step) => step.order === input.stepOrder + 1
            )
            const isNextStepLast =
              nextStep !== undefined &&
              !session.steps.some((step) => step.order > nextStep.order)
            const shouldQueueAi =
              (currentStep.type === "write" || currentStep.type === "revise") &&
              nextStep?.type === "feedback"

            if (shouldQueueAi && nextStep) {
              const kind = resolveAiKind(nextStep)
              const submittedText = extractTextResponse(validatedResponse)

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
                progressRepository.updateSessionProgress(userId, sessionId, {
                  currentStepOrder: nextStep.order,
                  stepResponsesJson: updated,
                }),
                progressRepository.saveSessionStepAiState(
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

              return true
            }

            if (isNextStepLast) {
              const journey = await journeyRepository.getById(session.journeyId)
              if (!journey) {
                throw createValidationError(
                  "여정 정보를 찾을 수 없습니다.",
                  "session"
                )
              }

              const nextSessionOrder = session.order + 1
              const completionRate = Math.min(
                1,
                (nextSessionOrder - 1) / journey.sessionCount
              )

              await Promise.all([
                progressRepository.updateSessionProgress(userId, sessionId, {
                  currentStepOrder: input.stepOrder + 1,
                  stepResponsesJson: updated,
                  status: "completed",
                }),
                progressRepository.updateJourneyProgress(
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

              return false
            }

            await progressRepository.updateSessionProgress(userId, sessionId, {
              currentStepOrder: input.stepOrder + 1,
              stepResponsesJson: updated,
            })

            return false
          }
        )

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
