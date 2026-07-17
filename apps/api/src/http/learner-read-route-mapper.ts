import type {
  LearnerCourseListQuery as LearnerCourseListWireQuery,
  LearnerCoursePage,
  LearnerProgressListQuery as LearnerProgressListWireQuery,
  LearnerProgressPage,
} from "@workspace/contracts/learning"
import type {
  LearnerCourseSummary,
  LearnerId,
  LearnerProgressCourse,
} from "@workspace/contracts/learning/read-data"
import {
  err,
  ok,
  type LearnerCourseReadQuery,
  type LearnerCursorCodec,
  type LearnerCursorPosition,
  type LearnerProgressReadQuery,
  type LearnerReadModelPage,
  type Result,
} from "@workspace/core/learning"

export type LearnerReadTransportError = { readonly kind: "invalid-cursor" }

export function decodeLearnerCourseListQuery(
  cursorCodec: LearnerCursorCodec,
  wireQuery: LearnerCourseListWireQuery
): Result<LearnerCourseReadQuery, LearnerReadTransportError> {
  const query = {
    category: wireQuery.category?.normalize("NFC"),
    query: wireQuery.query?.trim().normalize("NFC"),
    sort: wireQuery.sort,
  }
  const after = decodePosition(cursorCodec, wireQuery.cursor, {
    endpoint: "courses",
    fingerprint: cursorCodec.createFingerprint(query),
  })

  if (after.kind === "err") return after

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
  return {
    items: [...page.items],
    nextCursor:
      page.nextPosition === null
        ? null
        : cursorCodec.encode({
            endpoint: "courses",
            fingerprint: cursorCodec.createFingerprint({
              category: query.category,
              query: query.query,
              sort: query.sort,
            }),
            position: page.nextPosition,
          }),
  }
}

export function decodeLearnerProgressListQuery(
  cursorCodec: LearnerCursorCodec,
  userId: LearnerId,
  wireQuery: LearnerProgressListWireQuery
): Result<LearnerProgressReadQuery, LearnerReadTransportError> {
  const fingerprint = cursorCodec.createFingerprint({
    status: wireQuery.status,
  })
  const learnerScope = cursorCodec.createLearnerScope(userId)
  const after = decodePosition(cursorCodec, wireQuery.cursor, {
    endpoint: "progress",
    fingerprint,
    learnerScope,
  })

  if (after.kind === "err") return after

  return ok({
    ...(after.value === undefined ? {} : { after: after.value }),
    limit: wireQuery.limit,
    status: wireQuery.status,
    userId,
  })
}

export function encodeLearnerProgressPage(
  cursorCodec: LearnerCursorCodec,
  query: LearnerProgressReadQuery,
  page: LearnerReadModelPage<LearnerProgressCourse>
): LearnerProgressPage {
  return {
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
  }
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
