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
  AiFeedbackAttemptId,
  AiFeedbackAttemptStatus,
} from "#ai-feedback/domain/ai-feedback-attempt"

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
  | (ReservationMetadata & Readonly<{ kind: "already-failed" }>)
  | (ReservationMetadata &
      Readonly<{
        kind: "in-progress"
        retryAfterSeconds: number
      }>)
  | (ReservationMetadata & Readonly<{ kind: "limit-exceeded" }>)

export type AiFeedbackPersistenceError = Readonly<{
  cause: unknown
  kind: "ai-feedback-persistence-failed"
  operation: "fail-attempt" | "reserve-attempt" | "succeed-attempt"
}>

export type FinalizeAiFeedbackAttemptInput = Readonly<{
  attemptId: AiFeedbackAttemptId
  occurredAt: Date
}>

export type AiFeedbackRepository = Readonly<{
  markAttemptFailed: (
    input: FinalizeAiFeedbackAttemptInput
  ) => Promise<Result<boolean, AiFeedbackPersistenceError>>
  markAttemptSucceeded: (
    input: FinalizeAiFeedbackAttemptInput & Readonly<{ feedback: AiFeedback }>
  ) => Promise<Result<boolean, AiFeedbackPersistenceError>>
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
