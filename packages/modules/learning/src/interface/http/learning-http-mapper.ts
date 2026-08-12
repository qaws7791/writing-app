import type {
  LearnerCourseListQuery as LearnerCourseListWireQuery,
  LearnerCoursePage,
  LearnerProgressListQuery as LearnerProgressListWireQuery,
  LearnerProgressPage,
} from "@workspace/contracts/learning/learner-content"
import {
  learnerCoursePageSchema,
  learnerProgressPageSchema,
} from "@workspace/contracts/learning/learner-content"
import {
  completeLearnerStepResultSchema,
  type CompleteLearnerStepResult,
} from "@workspace/contracts/learning/learner-transition"
import {
  AppError,
  assertExhaustiveHttpResult,
} from "@workspace/http-platform/errors"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { LearnerId } from "@workspace/types/ids"

import type {
  LearningCommandError,
  LearningReadError,
} from "#learning/application/learning-application"
import type {
  LearnerCourseReadQuery,
  LearnerProgressReadQuery,
  LearnerReadModelPage,
} from "#learning/application/ports/learner-read-model-repository"
import type {
  LearnerCourseSummary,
  LearnerProgressCourse,
} from "#learning/application/learning-read-model"
import type {
  LearnerCursorCodec,
  LearnerCursorPosition,
} from "#learning/infrastructure/persistence/learner-cursor"
import type { CompleteLearnerStepTransitionResult } from "#learning/domain/learner-transition"

export type LearnerReadTransportError = Readonly<{ kind: "invalid-cursor" }>

export function decodeLearnerCourseListQuery(
  cursorCodec: LearnerCursorCodec,
  wireQuery: LearnerCourseListWireQuery
): Result<LearnerCourseReadQuery, LearnerReadTransportError> {
  const query = {
    category: wireQuery.category?.normalize("NFC"),
  }
  const after = decodePosition(cursorCodec, wireQuery.cursor, {
    endpoint: "courses",
    fingerprint: cursorCodec.createFingerprint(query),
  })
  if (after.isErr()) return err(after.error)
  return ok({
    ...query,
    ...(after.value === undefined ? {} : { after: after.value }),
    limit: wireQuery.limit,
  })
}

export function encodeLearnerCoursePage(
  cursorCodec: LearnerCursorCodec,
  query: LearnerCourseReadQuery,
  page: LearnerReadModelPage<LearnerCourseSummary>
): LearnerCoursePage {
  return learnerCoursePageSchema.parse({
    items: [...page.items],
    nextCursor:
      page.nextPosition === null
        ? null
        : cursorCodec.encode({
            endpoint: "courses",
            fingerprint: cursorCodec.createFingerprint({
              category: query.category,
            }),
            position: page.nextPosition,
          }),
  })
}

export function decodeLearnerProgressListQuery(
  cursorCodec: LearnerCursorCodec,
  learnerId: LearnerId,
  wireQuery: LearnerProgressListWireQuery
): Result<LearnerProgressReadQuery, LearnerReadTransportError> {
  const fingerprint = cursorCodec.createFingerprint({
    status: wireQuery.status,
  })
  const learnerScope = cursorCodec.createLearnerScope(learnerId)
  const after = decodePosition(cursorCodec, wireQuery.cursor, {
    endpoint: "progress",
    fingerprint,
    learnerScope,
  })
  if (after.isErr()) return err(after.error)
  return ok({
    ...(after.value === undefined ? {} : { after: after.value }),
    limit: wireQuery.limit,
    status: wireQuery.status,
    userId: learnerId,
  })
}

export function encodeLearnerProgressPage(
  cursorCodec: LearnerCursorCodec,
  query: LearnerProgressReadQuery,
  page: LearnerReadModelPage<LearnerProgressCourse>
): LearnerProgressPage {
  return learnerProgressPageSchema.parse({
    items: [...page.items],
    nextCursor:
      page.nextPosition === null
        ? null
        : cursorCodec.encode({
            endpoint: "progress",
            fingerprint: cursorCodec.createFingerprint({
              status: query.status,
            }),
            learnerScope: cursorCodec.createLearnerScope(query.userId),
            position: page.nextPosition,
          }),
  })
}

export function unwrapLearningResult<TValue>(
  result: Result<TValue, LearningCommandError | LearningReadError>
): TValue {
  if (result.isErr()) throw mapLearningError(result.error)
  return result.value
}

export function presentCompleteStepResult(
  result: CompleteLearnerStepTransitionResult
): CompleteLearnerStepResult {
  let presented: unknown
  switch (result.kind) {
    case "retry": {
      presented = {
        evaluation: result.evaluation,
        learning: result.learning,
        status: "retry",
      }
      break
    }
    case "advanced":
      presented = {
        evaluation: result.evaluation,
        learning: result.learning,
        status: "advanced",
      }
      break
    case "lesson-completed":
      presented = {
        courseLearning: result.courseLearning,
        evaluation: result.evaluation,
        lessonCompletion: result.lessonCompletion,
        status: "lesson_completed",
      }
      break
  }
  return completeLearnerStepResultSchema.parse(presented)
}

function mapLearningError(
  error: LearningCommandError | LearningReadError
): AppError {
  switch (error.kind) {
    case "invalid-request":
      return httpError(400, "VALIDATION_ERROR", "요청 내용을 확인해 주세요.")
    case "learner-inactive":
    case "learner-not-found":
      return httpError(403, "FORBIDDEN", "사용할 수 없는 계정입니다.")
    case "course-not-found":
      return httpError(404, "COURSE_NOT_FOUND", "코스를 찾을 수 없습니다.")
    case "identity-query-failed":
      return httpError(
        500,
        "INTERNAL_SERVER_ERROR",
        "학습 요청을 완료하지 못했습니다."
      )
    case "lesson-not-found":
      return httpError(404, "LESSON_NOT_FOUND", "레슨을 찾을 수 없습니다.")
    case "lesson-locked":
      return httpError(403, "LESSON_LOCKED", "아직 학습할 수 없는 레슨입니다.")
    case "curriculum-version-changed":
      return httpError(
        409,
        "CURRICULUM_VERSION_CHANGED",
        "학습 콘텐츠 버전이 변경되었습니다."
      )
    case "step-sequence-conflict":
      return httpError(
        409,
        "STEP_SEQUENCE_CONFLICT",
        "현재 학습 순서와 요청한 단계가 다릅니다."
      )
    case "step-draft-version-conflict":
      return httpError(
        409,
        "STEP_DRAFT_VERSION_CONFLICT",
        "다른 변경으로 단계 초안 버전이 바뀌었습니다."
      )
  }

  return assertExhaustiveHttpResult(error)
}

function decodePosition(
  cursorCodec: LearnerCursorCodec,
  cursor: string | undefined,
  expectation: Parameters<LearnerCursorCodec["decode"]>[1]
): Result<LearnerCursorPosition | undefined, LearnerReadTransportError> {
  if (cursor === undefined) return ok(undefined)
  const position = cursorCodec.decode(cursor, expectation)
  return position === null ? err({ kind: "invalid-cursor" }) : ok(position)
}

function httpError(
  status: 400 | 403 | 404 | 409 | 429 | 500 | 503,
  code: string,
  message: string,
  headers?: Readonly<Record<string, string>>
): AppError {
  return new AppError({ code, headers, message, status })
}
