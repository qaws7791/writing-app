import { createValidationError } from "../../../shared/error/index"
import type { SessionId, UserId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { ProgressRepository } from "../progress-port"
import type { SessionRuntime, SessionStepAiState } from "../progress-types"

export async function buildSessionRuntime(input: {
  journeyRepository: JourneyRepository
  progressRepository: ProgressRepository
  sessionId: SessionId
  userId: UserId
}): Promise<SessionRuntime> {
  const [session, progress, stepAiStates] = await Promise.all([
    input.journeyRepository.getSessionDetail(input.sessionId),
    input.progressRepository.getSessionProgress(input.userId, input.sessionId),
    input.progressRepository.listSessionStepAiStates(
      input.userId,
      input.sessionId
    ),
  ])

  if (session === null) {
    throw createValidationError("세션을 찾을 수 없습니다.", "session")
  }

  return {
    ...session,
    currentStepOrder: progress?.currentStepOrder ?? 1,
    status: progress?.status ?? "in_progress",
    stepResponsesJson: progress?.stepResponsesJson ?? {},
    stepAiStates: stepAiStates.map<SessionStepAiState>((state) => {
      const common = {
        attemptCount: state.attemptCount,
        errorMessage: state.errorMessage,
        sourceStepOrder: state.sourceStepOrder,
        status: state.status,
        stepOrder: state.stepOrder,
        updatedAt: state.updatedAt,
      }

      if (state.kind === "feedback") {
        return {
          ...common,
          kind: "feedback",
          resultJson: state.resultJson,
        }
      }

      return {
        ...common,
        kind: "comparison",
        resultJson: state.resultJson,
      }
    }),
  }
}
