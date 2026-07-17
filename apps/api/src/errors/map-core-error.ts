import { AppError } from "@/http/platform/errors"
import type { LearnerContentServiceError } from "@workspace/core/learning"

import type { LearnerReadTransportError } from "@/http/learner-read-route-mapper"

export type ApiCoreError =
  | LearnerContentServiceError
  | LearnerReadTransportError

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
  }
}
