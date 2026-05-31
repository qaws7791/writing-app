import type { AiFeedbackResultDto } from "./ai-feedback.dto"

export interface AiFeedbackProvider {
  createFeedback(input: {
    answer: string
    criteria: string
    focusAreas: string[]
    prompt: string
    scoreRange: readonly [number, number]
  }): Promise<AiFeedbackResultDto>
}
