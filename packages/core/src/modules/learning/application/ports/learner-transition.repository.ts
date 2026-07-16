import type {
  CompleteLearnerStepCommand,
  CompleteLearnerAiFeedbackCommand,
  CompleteLearnerStepTransitionResult,
  LearnerTransitionError,
  LearnerAiFeedbackContext,
  PrepareLearnerAiFeedbackCommand,
  StartLearnerLessonCommand,
  StartLearnerLessonResult,
} from "#core/modules/learning/domain/learner-transition"
import type { Result } from "#core/shared/result"

export type LearnerTransitionRepository = {
  readonly completeAiFeedbackStep: (
    command: CompleteLearnerAiFeedbackCommand
  ) => Promise<
    Result<CompleteLearnerStepTransitionResult, LearnerTransitionError>
  >
  readonly completeStep: (
    command: CompleteLearnerStepCommand
  ) => Promise<
    Result<CompleteLearnerStepTransitionResult, LearnerTransitionError>
  >
  readonly prepareAiFeedback: (
    command: PrepareLearnerAiFeedbackCommand
  ) => Promise<Result<LearnerAiFeedbackContext, LearnerTransitionError>>
  readonly startLesson: (
    command: StartLearnerLessonCommand
  ) => Promise<Result<StartLearnerLessonResult, LearnerTransitionError>>
}
