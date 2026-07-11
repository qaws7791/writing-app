import type {
  AiFeedbackPayload,
  CreateAiFeedbackCommand,
} from "@workspace/core/modules/ai-feedback/domain/ai-feedback.dto"

export type AiFeedbackAttemptStatus =
  | "expired"
  | "failed"
  | "pending"
  | "succeeded"

export type ReserveAiFeedbackAttemptInput = CreateAiFeedbackCommand & {
  readonly attemptId: string
  readonly expiresAt: Date
  readonly maxCompletedAttempts: number
}

export type ExpiredAiFeedbackAttempt = {
  readonly attemptId: string
  readonly attemptNumber: number
}

type ReservationMetadata = {
  readonly completedAttempts: number
  readonly expiredAttempts: readonly ExpiredAiFeedbackAttempt[]
}

export type ReserveAiFeedbackAttemptResult =
  | (ReservationMetadata & {
      readonly attemptId: string
      readonly attemptNumber: number
      readonly kind: "reserved"
    })
  | (ReservationMetadata & {
      readonly attemptNumber: number
      readonly kind: "already-succeeded"
      readonly result: AiFeedbackPayload
    })
  | (ReservationMetadata & {
      readonly kind: "already-failed"
    })
  | (ReservationMetadata & {
      readonly kind: "in-progress"
    })
  | (ReservationMetadata & {
      readonly kind: "limit-exceeded"
    })

export type FinalizeAiFeedbackAttemptInput = {
  readonly attemptId: string
  readonly occurredAt: Date
}

export type AiFeedbackRepository = {
  readonly reserveAttempt: (
    input: ReserveAiFeedbackAttemptInput
  ) => Promise<ReserveAiFeedbackAttemptResult>
  readonly markAttemptFailed: (
    input: FinalizeAiFeedbackAttemptInput
  ) => Promise<boolean>
  readonly markAttemptSucceeded: (
    input: FinalizeAiFeedbackAttemptInput & {
      readonly result: AiFeedbackPayload
    }
  ) => Promise<boolean>
}
