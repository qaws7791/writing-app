import type { CompleteLearnerStepResult } from "@workspace/contracts/learning/learner-transition"
import type {
  CompleteLearnerStepTransitionResult,
  LearnerTransitionError,
  StartLearnerLessonResult,
} from "@workspace/core/learning"
import type { Result } from "@workspace/kernel/result"
import { AppError } from "@workspace/http-platform/errors"

type LearnerCommandError = LearnerTransitionError

export function unwrapLearnerStartLessonResult(
  result: Result<StartLearnerLessonResult, LearnerTransitionError>
): StartLearnerLessonResult {
  return unwrapLearnerCommandResult(result)
}

export function unwrapLearnerCompleteStepResult(
  result: Result<CompleteLearnerStepTransitionResult, LearnerTransitionError>
): CompleteLearnerStepResult {
  return toCompleteStepResponse(unwrapLearnerCommandResult(result))
}

function unwrapLearnerCommandResult<TValue>(
  result: Result<TValue, LearnerCommandError>
): TValue {
  if (result.isErr()) throw mapLearnerCommandError(result.error)

  return result.value
}

function toCompleteStepResponse(
  result: CompleteLearnerStepTransitionResult
): CompleteLearnerStepResult {
  switch (result.kind) {
    case "retry":
      return {
        evaluation: result.evaluation,
        learning: result.learning,
        status: "retry",
      }
    case "advanced":
      return {
        evaluation: result.evaluation,
        learning: result.learning,
        status: "advanced",
      }
    case "lesson-completed":
      return {
        courseLearning: result.courseLearning,
        evaluation: result.evaluation,
        lessonCompletion: result.lessonCompletion,
        status: "lesson_completed",
      }
  }
}

function mapLearnerCommandError(error: LearnerCommandError): AppError {
  switch (error.kind) {
    case "invalid-request":
      return new AppError({
        code: "VALIDATION_ERROR",
        message: "요청 내용을 확인해 주세요.",
        status: 400,
      })
    case "lesson-not-found":
      return new AppError({
        code: "LESSON_NOT_FOUND",
        message: "레슨을 찾을 수 없습니다.",
        status: 404,
      })
    case "lesson-locked":
      return new AppError({
        code: "LESSON_LOCKED",
        message: "아직 학습할 수 없는 레슨입니다.",
        status: 403,
      })
    case "curriculum-version-changed":
      return new AppError({
        code: "CURRICULUM_VERSION_CHANGED",
        message: "학습 콘텐츠 버전이 변경되었습니다.",
        status: 409,
      })
    case "feedback-answer-not-found":
      return new AppError({
        code: "AI_FEEDBACK_ANSWER_NOT_FOUND",
        message: "코칭할 작성 답변을 찾을 수 없습니다.",
        status: 409,
      })
    case "feedback-target-invalid":
      return new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI 코칭 대상 설정이 올바르지 않습니다.",
        status: 500,
      })
    case "step-sequence-conflict":
      return new AppError({
        code: "STEP_SEQUENCE_CONFLICT",
        message: "현재 학습 순서와 요청한 단계가 다릅니다.",
        status: 409,
      })
  }
}
