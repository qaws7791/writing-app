import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAnswerChange,
  LessonStepAnswerPayload,
} from "../lesson-logic"
import type { LessonStepCheckedState } from "../lesson-step-policy"
import type { LessonStep } from "../lesson-types"

export type StepProps<T extends LessonStep> = {
  readonly step: T
  readonly checked: LessonStepCheckedState | false
  readonly onAnswerChange?: (change: LessonAnswerChange) => Promise<void> | void
  readonly onAnswerPayloadChange?: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
}
