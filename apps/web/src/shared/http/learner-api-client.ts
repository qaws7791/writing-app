import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"
import type {
  getCourseDetail,
  getCourses,
  getLesson,
  getProfile,
  getProgress,
  getWriting,
  getWritings,
  saveLearnerStepDraft,
  saveWriting,
} from "@workspace/http-client/learner"

export type LearnerApiRequestResult<TValue> =
  | Readonly<{ status: "ok"; value: TValue }>
  | Readonly<{ error: GeneratedApiClientError; status: "error" }>

export async function settleLearnerApiRequest<TValue>(
  request: Promise<TValue>
): Promise<LearnerApiRequestResult<TValue>> {
  try {
    return { status: "ok", value: await request }
  } catch (cause) {
    if (!(cause instanceof GeneratedApiClientError)) throw cause
    return { error: cause, status: "error" }
  }
}

export function readLearnerApiErrorCode(
  error: GeneratedApiClientError
): string {
  switch (error.detail.kind) {
    case "aborted":
      return "REQUEST_ABORTED"
    case "contract":
      return "CONTRACT_ERROR"
    case "http":
      return error.detail.error.code
    case "network":
      return "NETWORK_ERROR"
  }
}

export function readLearnerApiRetryAfterSeconds(
  error: GeneratedApiClientError
): number | null {
  return error.detail.kind === "http" ? error.detail.retryAfterSeconds : null
}

export function isLearnerApiAuthenticationError(
  error: GeneratedApiClientError
): boolean {
  return (
    error.detail.kind === "http" &&
    (error.detail.status === 401 ||
      error.detail.error.code === "UNAUTHENTICATED")
  )
}

export function isLearnerApiNetworkError(
  error: GeneratedApiClientError
): boolean {
  return error.detail.kind === "network"
}

export function isLearnerApiAbortedError(
  error: GeneratedApiClientError
): boolean {
  return error.detail.kind === "aborted"
}

export type LearnerCourseDetailDto = Awaited<ReturnType<typeof getCourseDetail>>
export type LearnerCourseUnitDto = LearnerCourseDetailDto["units"][number]
export type LearnerCourseLessonDto = LearnerCourseUnitDto["lessons"][number]
export type LearnerCourseSummaryDto = Awaited<
  ReturnType<typeof getCourses>
>["items"][number]
export type LearnerLessonDto = Awaited<ReturnType<typeof getLesson>>
export type LearnerStepDraftDto = LearnerLessonDto["drafts"][number]
export type LearnerStepDraftAnswerDto = LearnerStepDraftDto["answer"]
export type LearnerProfileDto = Awaited<ReturnType<typeof getProfile>>
export type LearnerProfileStatsDto = LearnerProfileDto["stats"]
export type LearnerProgressPageDto = Awaited<ReturnType<typeof getProgress>>
export type LearnerProgressCourseDto = LearnerProgressPageDto["items"][number]
export type LearnerSaveStepDraftResultDto = Awaited<
  ReturnType<typeof saveLearnerStepDraft>
>
export type LearnerSaveStepDraftBodyDto = Parameters<
  typeof saveLearnerStepDraft
>[2]
export type LearnerWritingDetailDto = Awaited<ReturnType<typeof getWriting>>
export type LearnerWritingSummaryDto = Awaited<
  ReturnType<typeof getWritings>
>["items"][number]
export type LearnerSaveWritingBodyDto = Parameters<typeof saveWriting>[1]
export type LearnerSaveWritingResultDto = Awaited<
  ReturnType<typeof saveWriting>
>
