import { ResultAsync } from "neverthrow"

import type { DomainError } from "../../../shared/error/index"
import { createValidationError } from "../../../shared/error/index"
import type { SessionId, UserId } from "../../../shared/brand/index"
import type { RepositoryTransactionManager } from "../../../shared/transaction/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { ProgressRepository } from "../progress-port"
import type { SessionRuntime, StepResponse } from "../progress-types"
import { buildSessionRuntime } from "./build-session-runtime"
import { buildAiQueueInput, shouldQueueAiStep } from "./submit-step-ai"
import { normalizeSubmitStepError } from "./submit-step-errors"
import { applyStepResponse, validateStepResponse } from "./submit-step-response"

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
            const updated = applyStepResponse(
              current,
              input.stepOrder,
              validatedResponse
            )

            const nextStep = session.steps.find(
              (step) => step.order === input.stepOrder + 1
            )
            const isNextStepLast =
              nextStep !== undefined &&
              !session.steps.some((step) => step.order > nextStep.order)

            if (shouldQueueAiStep(currentStep, nextStep)) {
              const queuedAi = buildAiQueueInput({
                currentStep,
                nextStep,
                response: validatedResponse,
                stepResponses: updated,
              })

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
                    kind: queuedAi.kind,
                    sourceStepOrder: input.stepOrder,
                    status: "pending",
                    attemptCount: 0,
                    inputJson: queuedAi.inputJson,
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
      normalizeSubmitStepError
    )
}
