import { z } from "zod"

import {
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "#contracts/content/ids"
import {
  completedLessonLearningStateSchema,
  courseLearningStateSchema,
  inProgressLessonLearningStateSchema,
  lessonCompletionSchema,
  lockedLessonLearningStateSchema,
  notStartedLessonLearningStateSchema,
} from "#contracts/learning/learner-content"
import { learnerStepDraftSchema } from "#contracts/learning/learner-step-answer"

export {
  learnerStepDraftAnswerSchema,
  learnerStepDraftSchema,
  learnerStepSubmissionSchema,
  saveLearnerStepDraftBodySchema,
  stepEvaluationSchema,
  stepItemVerdictSchema,
  type LearnerStepDraft,
  type LearnerStepDraftAnswer,
  type LearnerStepSubmission,
  type SaveLearnerStepDraftBody,
  type StepEvaluation,
  type StepItemVerdict,
} from "#contracts/learning/learner-step-answer"

export const startLearnerLessonBodySchema = z.strictObject({
  expectedCurriculumVersionId: curriculumVersionIdSchema,
})

export const completeLearnerStepParamsSchema = z.strictObject({
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export const completeLearnerLessonBodySchema = z.strictObject({
  completedStepIds: z.array(lessonStepIdSchema),
  durationSeconds: z.number().int().min(0),
  expectedCurriculumVersionId: curriculumVersionIdSchema,
  mistakeCount: z.number().int().min(0),
  totalAttempts: z.number().int().min(0),
})

export const saveLearnerLessonProgressBodySchema = z.strictObject({
  completedStepIds: z.array(lessonStepIdSchema),
  currentStepId: lessonStepIdSchema,
  expectedCurriculumVersionId: curriculumVersionIdSchema,
})

export const completeLearnerLessonResultSchema = z.strictObject({
  accuracyPercent: z.number().int().min(0).max(100),
  courseLearning: courseLearningStateSchema,
  durationMinutes: z.number().int().min(0),
  lessonCompletion: lessonCompletionSchema,
  status: z.literal("lesson_completed"),
  streakDays: z.number().int().min(0),
  streakIncreased: z.boolean(),
})

const learnerStepDraftListField = {
  drafts: z.array(learnerStepDraftSchema),
}

export const startLearnerLessonResponseSchema = z.discriminatedUnion("status", [
  lockedLessonLearningStateSchema.extend(learnerStepDraftListField),
  notStartedLessonLearningStateSchema.extend(learnerStepDraftListField),
  inProgressLessonLearningStateSchema.extend(learnerStepDraftListField),
  completedLessonLearningStateSchema.extend(learnerStepDraftListField),
])
export const saveLearnerStepDraftResponseSchema = learnerStepDraftSchema

export type StartLearnerLessonBody = z.infer<
  typeof startLearnerLessonBodySchema
>
export type CompleteLearnerLessonBody = z.infer<
  typeof completeLearnerLessonBodySchema
>
export type SaveLearnerLessonProgressBody = z.infer<
  typeof saveLearnerLessonProgressBodySchema
>
export type CompleteLearnerLessonResult = z.infer<
  typeof completeLearnerLessonResultSchema
>
