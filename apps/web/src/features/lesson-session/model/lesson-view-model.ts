import {
  learnerLessonSchema,
  type LearnerLesson,
} from "@workspace/contracts/learning/learner-content"
import {
  completeLearnerLessonResultSchema,
  learnerStepDraftSchema,
  startLearnerLessonResponseSchema,
  type CompleteLearnerLessonResult,
  type LearnerStepDraft,
} from "@workspace/contracts/learning/learner-transition"
import type { z } from "zod"

export function toLessonViewModel(wire: unknown): LearnerLesson {
  return learnerLessonSchema.parse(wire)
}

export function toLessonStartResult(
  wire: unknown
): z.infer<typeof startLearnerLessonResponseSchema> {
  return startLearnerLessonResponseSchema.parse(wire)
}

export function toLessonCompleteLessonResult(
  wire: unknown
): CompleteLearnerLessonResult {
  return completeLearnerLessonResultSchema.parse(wire)
}

export function parseLessonStepDrafts(
  wire: unknown
): readonly LearnerStepDraft[] {
  return learnerStepDraftSchema.array().parse(wire)
}

export function parseLessonStepDraft(wire: unknown): LearnerStepDraft {
  return learnerStepDraftSchema.parse(wire)
}
