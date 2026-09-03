import {
  learnerLessonSchema,
  type LearnerLesson,
  type LearnerLessonStep,
} from "@workspace/contracts/learning/learner-content"
import {
  completeLearnerLessonResultSchema,
  learnerStepDraftSchema,
  startLearnerLessonResponseSchema,
  type CompleteLearnerLessonBody,
  type CompleteLearnerLessonResult,
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
export type LessonCompleteLessonBody = CompleteLearnerLessonBody
export type LessonCompleteLessonResult = CompleteLearnerLessonResult
export type LessonStartResult = z.infer<typeof startLearnerLessonResponseSchema>

export function toLessonViewModel(wire: unknown): Lesson {
  return learnerLessonSchema.parse(wire)
}

export function toLessonStartResult(wire: unknown): LessonStartResult {
  return startLearnerLessonResponseSchema.parse(wire)
}

export function toLessonCompleteLessonResult(
  wire: unknown
): LessonCompleteLessonResult {
  return completeLearnerLessonResultSchema.parse(wire)
}

export function parseLessonStepDrafts(
  wire: unknown
): readonly LessonStepDraft[] {
  return learnerStepDraftSchema.array().parse(wire)
}

export function parseLessonStepDraft(wire: unknown): LessonStepDraft {
  return learnerStepDraftSchema.parse(wire)
}
