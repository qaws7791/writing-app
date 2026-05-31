import type { LessonId } from "../content"
import type { AiFeedbackResultDto } from "./ai-feedback.dto"
import type { UserId } from "../learning"

export interface CreateCompletedFeedbackAttemptInput {
  answerSnapshot: string
  attemptNumber: number
  feedbackStepId: string
  lessonId: LessonId
  result: AiFeedbackResultDto
  sourceStepId: string
  userId: UserId
}

export interface AiFeedbackRepository {
  countCompletedAttempts(
    userId: UserId,
    lessonId: LessonId,
    feedbackStepId: string
  ): Promise<number>
  createCompletedAttempt(
    input: CreateCompletedFeedbackAttemptInput
  ): Promise<void>
}
