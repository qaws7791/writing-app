import type { Result } from "@workspace/kernel/result"
import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"

import type { AiFeedback } from "#ai-feedback/domain/ai-feedback"
import type {
  AiFeedbackFailureCode,
  AiFeedbackAttemptId,
  AiFeedbackAttemptStatus,
} from "#ai-feedback/domain/ai-feedback-attempt"
import type {
  AiFeedbackDailyQuotaPolicy,
  AiFeedbackQuotaDate,
} from "#ai-feedback/domain/ai-feedback-quota"

export type AiFeedbackAttemptScope = Readonly<{
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
}>

type ReserveAiFeedbackAttemptInput = AiFeedbackAttemptScope &
  Readonly<{
    answer: string
    attemptId: AiFeedbackAttemptId
    createdAt: Date
    expiresAt: Date
    idempotencyKey: string
    maxCompletedAttempts: number
    model: string
    promptPolicyVersion: string
    quotaDate: AiFeedbackQuotaDate
    quotaPolicy: AiFeedbackDailyQuotaPolicy
    quotaRetryAfterSeconds: number
  }>

type ExpiredAiFeedbackAttempt = Readonly<{
  attemptId: AiFeedbackAttemptId
  attemptNumber: number
}>

type ReservationMetadata = Readonly<{
  completedAttempts: number
  expiredAttempts: readonly ExpiredAiFeedbackAttempt[]
}>

type ReserveAiFeedbackAttemptResult =
  | (ReservationMetadata &
      Readonly<{
        attemptId: AiFeedbackAttemptId
        attemptNumber: number
        kind: "reserved"
      }>)
  | (ReservationMetadata &
      Readonly<{
        attemptId: AiFeedbackAttemptId
        attemptNumber: number
        feedback: AiFeedback
        kind: "already-succeeded"
      }>)
  | (ReservationMetadata &
      Readonly<{
        failureCode: AiFeedbackFailureCode
        kind: "already-failed"
      }>)
  | (ReservationMetadata &
      Readonly<{
        kind: "in-progress"
        retryAfterSeconds: number
      }>)
  | (ReservationMetadata &
      Readonly<{
        kind: "daily-quota-exceeded"
        retryAfterSeconds: number
      }>)
  | (ReservationMetadata & Readonly<{ kind: "limit-exceeded" }>)

export type AiFeedbackPersistenceError = Readonly<{
  cause: unknown
  kind: "ai-feedback-persistence-failed"
  operation: "fail-attempt" | "reserve-attempt" | "succeed-attempt"
}>

type FinalizeAiFeedbackAttemptInput = Readonly<{
  attemptId: AiFeedbackAttemptId
  inputTokenCount?: number
  latencyMs: number
  occurredAt: Date
  outputTokenCount?: number
}>

export type FinalizeAiFeedbackAttemptResult =
  | Readonly<{ kind: "not-pending" }>
  | Readonly<{ kind: "transitioned" }>

export type AiFeedbackRepository = Readonly<{
  markAttemptFailed: (
    input: FinalizeAiFeedbackAttemptInput &
      Readonly<{ failureCode: AiFeedbackFailureCode }>
  ) => Promise<
    Result<FinalizeAiFeedbackAttemptResult, AiFeedbackPersistenceError>
  >
  markAttemptSucceeded: (
    input: FinalizeAiFeedbackAttemptInput & Readonly<{ feedback: AiFeedback }>
  ) => Promise<
    Result<FinalizeAiFeedbackAttemptResult, AiFeedbackPersistenceError>
  >
  reserveAttempt: (
    input: ReserveAiFeedbackAttemptInput
  ) => Promise<
    Result<ReserveAiFeedbackAttemptResult, AiFeedbackPersistenceError>
  >
}>

export type AiFeedbackAttemptTransition = Readonly<{
  attemptId: AiFeedbackAttemptId
  attemptNumber: number
  fromStatus: AiFeedbackAttemptStatus | null
  reason: "provider-failed" | "provider-succeeded" | "reserved" | "ttl-expired"
  scope: AiFeedbackAttemptScope
  toStatus: AiFeedbackAttemptStatus
}>
