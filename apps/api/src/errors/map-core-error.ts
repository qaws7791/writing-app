import { AppError } from "@workspace/hono/errors"
import type { AiFeedbackServiceError } from "@workspace/core/ai-feedback"
import type { LearnerContentServiceError } from "@workspace/core/content"
import type {
  LearnerTransitionError,
  ProgressServiceError,
} from "@workspace/core/learning"

export type ApiCoreError =
  | AiFeedbackServiceError
  | LearnerContentServiceError
  | LearnerTransitionError
  | ProgressServiceError

export type ApiCoreResult<TValue> =
  | {
      readonly kind: "ok"
      readonly value: TValue
    }
  | {
      readonly error: ApiCoreError
      readonly kind: "err"
    }

export function unwrapApiCoreResult<TValue>(
  result: ApiCoreResult<TValue>
): TValue {
  if (result.kind === "err") {
    throw mapCoreError(result.error)
  }

  return result.value
}

export function mapCoreError(error: ApiCoreError): AppError {
  switch (error.kind) {
    case "invalid-cursor":
      return new AppError({
        code: "INVALID_CURSOR",
        message: "페이지 커서가 유효하지 않습니다.",
        status: 400,
      })
    case "invalid-request":
      return new AppError({
        code: "VALIDATION_ERROR",
        message: "요청 내용을 확인해 주세요.",
        status: 400,
      })
    case "course-not-found":
      return new AppError({
        code: "COURSE_NOT_FOUND",
        message: "코스를 찾을 수 없습니다.",
        status: 404,
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
    case "attempt-limit-exceeded":
      return new AppError({
        code: "ATTEMPT_LIMIT_EXCEEDED",
        message: "AI 코칭 시도 횟수를 모두 사용했습니다.",
        status: 429,
      })
    case "attempt-in-progress":
      return new AppError({
        code: "ATTEMPT_IN_PROGRESS",
        message: "AI 코칭 요청을 처리하고 있습니다.",
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
    case "provider-failed":
      return new AppError({
        code: "PROVIDER_UNAVAILABLE",
        message: "AI 코칭을 잠시 사용할 수 없습니다.",
        status: 503,
      })
  }
}
