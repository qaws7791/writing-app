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

export type AiFeedbackRepository = {
  readonly countCompletedAttempts: (
    input: CountAiFeedbackAttemptsInput
  ) => Promise<number>
  readonly saveAttempt: (record: AiFeedbackAttemptRecord) => Promise<void>
}
