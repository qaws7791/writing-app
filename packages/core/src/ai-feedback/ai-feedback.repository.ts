import type { LessonId } from "../content"
import type { AiFeedbackResultDto } from "./ai-feedback.dto"
import type { UserId } from "../learning"

export interface CreateNextCompletedFeedbackAttemptInput {
  answerSnapshot: string
  feedbackStepId: string
  lessonId: LessonId
  maxAttempts: number
  result: AiFeedbackResultDto
  sourceStepId: string
  userId: UserId
}

export type CreateNextCompletedFeedbackAttemptResult =
  | {
      status: "created"
      attemptNumber: number
    }
  | {
      status: "retry-limit-exceeded"
    }

export interface AiFeedbackRepository {
  countCompletedAttempts(
    userId: UserId,
    lessonId: LessonId,
    feedbackStepId: string
  ): Promise<number>
  createNextCompletedAttempt(
    input: CreateNextCompletedFeedbackAttemptInput
  ): Promise<CreateNextCompletedFeedbackAttemptResult>
}
