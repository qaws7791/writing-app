import { z } from "zod"

export const aiFeedbackRequestDtoSchema = z.object({
  answer: z.string().min(1).optional(),
  feedbackStepId: z.string().min(1),
  lessonId: z.string().min(1),
})

export const aiFeedbackResultDtoSchema = z.object({
  improvements: z.array(z.string().min(1)),
  nextAction: z.string().min(1),
  score: z.number().int().min(0),
  scoreRange: z.tuple([z.number().int(), z.number().int()]),
  strengths: z.array(z.string().min(1)),
  summary: z.string().min(1),
})

export type AiFeedbackRequestDto = z.infer<typeof aiFeedbackRequestDtoSchema>
export type AiFeedbackResultDto = z.infer<typeof aiFeedbackResultDtoSchema>
