import { z } from "zod"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/content.ids"
import {
  courseLearningStateSchema,
  inProgressLessonLearningStateSchema,
  lessonCompletionSchema,
  lessonLearningStateSchema,
} from "@workspace/contracts/learning/learner-content"
import {
  curriculumVersionIdSchema,
  lessonStepItemIdSchema,
} from "@workspace/contracts/learning/learning.ids"
import { learningAnswerTextMaxLength } from "@workspace/contracts/learning/learning"
import { aiFeedbackResultDtoSchema } from "@workspace/contracts/ai-feedback"

export const startLearnerLessonBodySchema = z.strictObject({
  expectedCurriculumVersionId: curriculumVersionIdSchema,
})

export const completeLearnerStepParamsSchema = z.strictObject({
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export const learnerStepSubmissionSchema = z.discriminatedUnion("type", [
  z.strictObject({
    selectedOptionId: lessonStepItemIdSchema,
    type: z.literal("MULTIPLE_CHOICE"),
  }),
  z.strictObject({
    selectedChoiceIds: z.array(lessonStepItemIdSchema).min(1).max(100),
    type: z.literal("FILL_BLANK"),
  }),
  z.strictObject({
    selectedItemIds: z.array(lessonStepItemIdSchema).min(1).max(100),
    type: z.literal("SELECT"),
  }),
  z.strictObject({
    orderedItemIds: z.array(lessonStepItemIdSchema).min(1).max(100),
    type: z.literal("ORDER"),
  }),
  z.strictObject({
    pairs: z
      .array(
        z.strictObject({
          leftItemId: lessonStepItemIdSchema,
          rightItemId: lessonStepItemIdSchema,
        })
      )
      .min(1)
      .max(100),
    type: z.literal("MATCH"),
  }),
  z.strictObject({
    assignments: z
      .array(
        z.strictObject({
          categoryId: lessonStepItemIdSchema,
          itemId: lessonStepItemIdSchema,
        })
      )
      .min(1)
      .max(100),
    type: z.literal("CATEGORIZE"),
  }),
  z.strictObject({
    text: z.string().min(1).max(learningAnswerTextMaxLength),
    type: z.literal("WRITE"),
  }),
])

export const completeLearnerStepBodySchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("acknowledge") }),
  z.strictObject({
    answer: learnerStepSubmissionSchema,
    kind: z.literal("answer"),
  }),
])

export const stepItemVerdictSchema = z.enum(["correct", "incorrect", "missed"])

const evaluatedItemSchema = z.strictObject({
  id: lessonStepItemIdSchema,
  verdict: stepItemVerdictSchema,
})

const choiceEvaluationBaseSchema = z.strictObject({
  correct: z.boolean(),
  correctItemIds: z.array(lessonStepItemIdSchema).min(1),
  explanation: z.string(),
  items: z.array(evaluatedItemSchema).min(1),
})

export const stepEvaluationSchema = z.discriminatedUnion("type", [
  choiceEvaluationBaseSchema.extend({ type: z.literal("MULTIPLE_CHOICE") }),
  choiceEvaluationBaseSchema.extend({ type: z.literal("FILL_BLANK") }),
  choiceEvaluationBaseSchema.extend({ type: z.literal("SELECT") }),
  choiceEvaluationBaseSchema.extend({ type: z.literal("ORDER") }),
  z.strictObject({
    correct: z.boolean(),
    explanation: z.string(),
    items: z.array(
      z.strictObject({
        expectedRightItemId: lessonStepItemIdSchema,
        leftItemId: lessonStepItemIdSchema,
        rightItemId: lessonStepItemIdSchema,
        verdict: stepItemVerdictSchema,
      })
    ),
    type: z.literal("MATCH"),
  }),
  z.strictObject({
    correct: z.boolean(),
    explanation: z.string(),
    items: z.array(
      z.strictObject({
        categoryId: lessonStepItemIdSchema,
        expectedCategoryId: lessonStepItemIdSchema,
        itemId: lessonStepItemIdSchema,
        verdict: stepItemVerdictSchema,
      })
    ),
    type: z.literal("CATEGORIZE"),
  }),
  z.strictObject({
    accepted: z.literal(true),
    type: z.literal("WRITE"),
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

export const startLearnerLessonResponseSchema = lessonLearningStateSchema
export const completeLearnerStepResponseSchema = completeLearnerStepResultSchema

export const learnerAiFeedbackTransitionResultSchema = z.strictObject({
  feedback: aiFeedbackResultDtoSchema,
  transition: completeLearnerStepResultSchema,
})

export type StartLearnerLessonBody = z.infer<
  typeof startLearnerLessonBodySchema
>
export type LearnerStepSubmission = z.infer<typeof learnerStepSubmissionSchema>
export type CompleteLearnerStepBody = z.infer<
  typeof completeLearnerStepBodySchema
>
export type StepItemVerdict = z.infer<typeof stepItemVerdictSchema>
export type StepEvaluation = z.infer<typeof stepEvaluationSchema>
export type CompleteLearnerStepResult = z.infer<
  typeof completeLearnerStepResultSchema
>
export type LearnerAiFeedbackTransitionResult = z.infer<
  typeof learnerAiFeedbackTransitionResultSchema
>
