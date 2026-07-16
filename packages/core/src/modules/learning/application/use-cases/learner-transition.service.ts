import type { LearnerTransitionRepository } from "#core/modules/learning/application/ports/learner-transition.repository"
import type {
  CompleteLearnerStepCommand,
  CompleteLearnerStepTransitionResult,
  LearnerTransitionError,
  StartLearnerLessonCommand,
  StartLearnerLessonResult,
} from "#core/modules/learning/domain/learner-transition"
import type { Result } from "#core/shared/result"

export type LearnerTransitionService = {
  readonly completeStep: (
    command: CompleteLearnerStepCommand
  ) => Promise<
    Result<CompleteLearnerStepTransitionResult, LearnerTransitionError>
  >
  readonly startLesson: (
    command: StartLearnerLessonCommand
  ) => Promise<Result<StartLearnerLessonResult, LearnerTransitionError>>
}

export function createLearnerTransitionService(
  repository: LearnerTransitionRepository
): LearnerTransitionService {
  return {
    completeStep: (command) => repository.completeStep(command),
    startLesson: (command) => repository.startLesson(command),
  }
}
