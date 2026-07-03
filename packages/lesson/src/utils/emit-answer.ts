import { createLessonStepAnswer } from "../lesson-logic"
import type {
  LessonAnswerChange,
  LessonStepAnswerPayload,
} from "../lesson-logic"

export function emitAnswer(
  onAnswerChange:
    | ((change: LessonAnswerChange) => Promise<void> | void)
    | undefined,
  stepId: string,
  payload: LessonStepAnswerPayload,
  onAnswerPayloadChange?:
    | ((change: {
        readonly payload: LessonStepAnswerPayload
        readonly stepId: string
      }) => void)
    | undefined
) {
  onAnswerPayloadChange?.({
    payload,
    stepId,
  })

  void onAnswerChange?.({
    answer: createLessonStepAnswer(payload),
    stepId,
  })
}
