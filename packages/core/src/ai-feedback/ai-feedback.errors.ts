import { z } from "zod"

export const answerNotFoundErrorDtoSchema = z.object({
  code: z.literal("answer-not-found"),
  message: z.literal("답변을 찾을 수 없습니다."),
})

export const feedbackStepNotFoundErrorDtoSchema = z.object({
  code: z.literal("feedback-step-not-found"),
  message: z.literal("피드백 스텝을 찾을 수 없습니다."),
})

export const feedbackRetryLimitExceededErrorDtoSchema = z.object({
  code: z.literal("feedback-retry-limit-exceeded"),
  message: z.literal("피드백 재시도 한도를 초과했습니다."),
})

export const aiFeedbackUnavailableErrorDtoSchema = z.object({
  code: z.literal("ai-feedback-unavailable"),
  message: z.literal("인공지능 피드백을 사용할 수 없습니다."),
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
