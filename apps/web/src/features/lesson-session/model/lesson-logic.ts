import type {
  LearnerLesson,
  LearnerLessonStep,
} from "@workspace/contracts/learning/learner-content"
import type { LearnerStepDraftAnswer } from "@workspace/contracts/learning/learner-transition"

export type LessonStepAnswerPayload = LearnerStepDraftAnswer

export function getLessonStep(
  lesson: LearnerLesson,
  stepIndex: number
): LearnerLessonStep | null {
  return lesson.steps[stepIndex] ?? null
}
