import type {
  CreateAiFeedbackCommand,
  AiFeedbackPayload,
} from "@workspace/core/ai-feedback/ai-feedback.dto"

export type CountAiFeedbackAttemptsInput = Pick<
  CreateAiFeedbackCommand,
  "lessonId" | "stepId" | "userId"
>

export type AiFeedbackAttemptRecord = CreateAiFeedbackCommand & {
  readonly attemptNumber: number
  readonly result: AiFeedbackPayload
}

export type SaveAiFeedbackAttemptInput = CreateAiFeedbackCommand & {
  readonly result: AiFeedbackPayload
}

export type SaveAiFeedbackAttemptResult =
  | {
      readonly attemptNumber: number
      readonly kind: "saved"
    }
  | {
      readonly completedAttempts: number
      readonly kind: "limit-exceeded"
    }

export type AiFeedbackRepository = {
  readonly countCompletedAttempts: (
    input: CountAiFeedbackAttemptsInput
  ) => Promise<number>
  readonly saveCompletedAttempt: (
    record: SaveAiFeedbackAttemptInput,
    maxAttempts: number
  ) => Promise<SaveAiFeedbackAttemptResult>
}
