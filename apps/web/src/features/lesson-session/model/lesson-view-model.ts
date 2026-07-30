import type { AiFeedbackResultDto } from "@workspace/contracts/ai-feedback/feedback"
import {
  learnerLessonSchema,
  type LearnerLesson,
  type LearnerLessonStep,
} from "@workspace/contracts/learning/learner-content"
import {
  completeLearnerStepResultSchema,
  learnerStepDraftSchema,
  startLearnerLessonResponseSchema,
  type CompleteLearnerStepBody,
  type CompleteLearnerStepResult,
  type LearnerStepDraft,
  type LearnerStepDraftAnswer,
  type StepEvaluation,
} from "@workspace/contracts/learning/learner-transition"
import type { z } from "zod"

export type Lesson = LearnerLesson
export type LessonStep = LearnerLessonStep
export type LessonStepDraft = LearnerStepDraft
export type LessonStepDraftAnswer = LearnerStepDraftAnswer
export type LessonStepEvaluation = StepEvaluation
export type LessonCompleteStepBody = CompleteLearnerStepBody
export type LessonCompleteStepResult = CompleteLearnerStepResult
export type LessonStartResult = z.infer<typeof startLearnerLessonResponseSchema>
export type LessonAiFeedback = AiFeedbackResultDto

export function toLessonViewModel(wire: unknown): Lesson {
  return learnerLessonSchema.parse(wire)
}

export function toLessonStartResult(wire: unknown): LessonStartResult {
  return startLearnerLessonResponseSchema.parse(wire)
}

export function toLessonCompleteStepResult(
  wire: unknown
): LessonCompleteStepResult {
  return completeLearnerStepResultSchema.parse(wire)
}

export function parseLessonStepDrafts(
  wire: unknown
): readonly LessonStepDraft[] {
  return learnerStepDraftSchema.array().parse(wire)
}

export function parseLessonStepDraft(wire: unknown): LessonStepDraft {
  return learnerStepDraftSchema.parse(wire)
}
