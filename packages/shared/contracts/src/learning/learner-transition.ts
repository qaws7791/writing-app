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
import {
  learnerStepDraftSchema,
  learnerStepSubmissionSchema,
  stepEvaluationSchema,
} from "#contracts/learning/learner-step-answer"
import { aiFeedbackResultDtoSchema } from "#contracts/ai-feedback/feedback"

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

export const completeLearnerStepBodySchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("acknowledge") }),
  z.strictObject({ kind: z.literal("skip-ai-feedback") }),
  z.strictObject({
    answer: learnerStepSubmissionSchema,
    kind: z.literal("answer"),
  }),
])

export const completeLearnerStepResultSchema = z.discriminatedUnion("status", [
  z.strictObject({
    evaluation: stepEvaluationSchema,
    learning: inProgressLessonLearningStateSchema,
    status: z.literal("retry"),
  }),
  z.strictObject({
    evaluation: stepEvaluationSchema.nullable(),
    learning: inProgressLessonLearningStateSchema,
    status: z.literal("advanced"),
  }),
  z.strictObject({
    courseLearning: courseLearningStateSchema,
    evaluation: stepEvaluationSchema.nullable(),
    lessonCompletion: lessonCompletionSchema,
    status: z.literal("lesson_completed"),
  }),
])

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

export const learnerAiFeedbackTransitionResultSchema = z.strictObject({
  feedback: aiFeedbackResultDtoSchema,
  transition: completeLearnerStepResultSchema,
})

export type StartLearnerLessonBody = z.infer<
  typeof startLearnerLessonBodySchema
>
export type CompleteLearnerStepBody = z.infer<
  typeof completeLearnerStepBodySchema
>
export type CompleteLearnerStepResult = z.infer<
  typeof completeLearnerStepResultSchema
>
export type LearnerAiFeedbackTransitionResult = z.infer<
  typeof learnerAiFeedbackTransitionResultSchema
>
