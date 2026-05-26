import { z } from "zod"

export const answerNotFoundErrorDtoSchema = z.object({
  code: z.literal("answer-not-found"),
  message: z.literal("Answer was not found."),
})

export const feedbackStepNotFoundErrorDtoSchema = z.object({
  code: z.literal("feedback-step-not-found"),
  message: z.literal("Feedback step was not found."),
})

export const feedbackRetryLimitExceededErrorDtoSchema = z.object({
  code: z.literal("feedback-retry-limit-exceeded"),
  message: z.literal("Feedback retry limit was exceeded."),
})

export const aiFeedbackUnavailableErrorDtoSchema = z.object({
  code: z.literal("ai-feedback-unavailable"),
  message: z.literal("AI feedback is unavailable."),
})

export type AnswerNotFoundErrorDto = z.infer<
  typeof answerNotFoundErrorDtoSchema
>
export type FeedbackStepNotFoundErrorDto = z.infer<
  typeof feedbackStepNotFoundErrorDtoSchema
>
export type FeedbackRetryLimitExceededErrorDto = z.infer<
  typeof feedbackRetryLimitExceededErrorDtoSchema
>
export type AiFeedbackUnavailableErrorDto = z.infer<
  typeof aiFeedbackUnavailableErrorDtoSchema
>
