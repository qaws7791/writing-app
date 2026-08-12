import { z } from "zod"

import type { AnswerableLessonStepType } from "#contracts/content/steps"
import {
  curriculumVersionIdSchema,
  lessonStepIdSchema,
} from "#contracts/content/ids"
import { lessonStepItemIdSchema } from "#contracts/learning/ids"

const answerItemIdListSchema = z.array(lessonStepItemIdSchema).min(1).max(100)
const draftItemIdListSchema = z.array(lessonStepItemIdSchema).max(100)

const multipleChoiceSubmissionSchema = z.strictObject({
  selectedOptionId: lessonStepItemIdSchema,
  type: z.literal("MULTIPLE_CHOICE"),
})
const multipleChoiceDraftSchema = z.strictObject({
  selectedOptionId: lessonStepItemIdSchema.nullable(),
  type: z.literal("MULTIPLE_CHOICE"),
})
const fillBlankSubmissionSchema = z.strictObject({
  selectedChoiceIds: answerItemIdListSchema,
  type: z.literal("FILL_BLANK"),
})
const fillBlankDraftSchema = z.strictObject({
  selectedChoiceIds: draftItemIdListSchema,
  type: z.literal("FILL_BLANK"),
})
const selectSubmissionSchema = z.strictObject({
  selectedItemIds: answerItemIdListSchema,
  type: z.literal("SELECT"),
})
const selectDraftSchema = z.strictObject({
  selectedItemIds: draftItemIdListSchema,
  type: z.literal("SELECT"),
})
const orderSubmissionSchema = z.strictObject({
  orderedItemIds: answerItemIdListSchema,
  type: z.literal("ORDER"),
})
const orderDraftSchema = z.strictObject({
  orderedItemIds: draftItemIdListSchema,
  type: z.literal("ORDER"),
})

const matchPairSchema = z.strictObject({
  leftItemId: lessonStepItemIdSchema,
  rightItemId: lessonStepItemIdSchema,
})
const matchSubmissionSchema = z.strictObject({
  pairs: z.array(matchPairSchema).min(1).max(100),
  type: z.literal("MATCH"),
})
const matchDraftSchema = z.strictObject({
  pairs: z.array(matchPairSchema).max(100),
  type: z.literal("MATCH"),
})

const categorizeAssignmentSchema = z.strictObject({
  categoryId: lessonStepItemIdSchema,
  itemId: lessonStepItemIdSchema,
})
const categorizeSubmissionSchema = z.strictObject({
  assignments: z.array(categorizeAssignmentSchema).min(1).max(100),
  type: z.literal("CATEGORIZE"),
})
const categorizeDraftSchema = z.strictObject({
  assignments: z.array(categorizeAssignmentSchema).max(100),
  type: z.literal("CATEGORIZE"),
})

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

const multipleChoiceEvaluationSchema = choiceEvaluationBaseSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
})
const fillBlankEvaluationSchema = choiceEvaluationBaseSchema.extend({
  type: z.literal("FILL_BLANK"),
})
const selectEvaluationSchema = choiceEvaluationBaseSchema.extend({
  type: z.literal("SELECT"),
})
const orderEvaluationSchema = choiceEvaluationBaseSchema.extend({
  type: z.literal("ORDER"),
})
const matchEvaluationSchema = z.strictObject({
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
})
const categorizeEvaluationSchema = z.strictObject({
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
})

type LearnerStepInteractionDefinition = {
  readonly draftSchema: z.ZodType
  readonly evaluationSchema: z.ZodType
  readonly submissionSchema: z.ZodType
}

const learnerStepInteractionDefinitions = {
  MULTIPLE_CHOICE: {
    draftSchema: multipleChoiceDraftSchema,
    evaluationSchema: multipleChoiceEvaluationSchema,
    submissionSchema: multipleChoiceSubmissionSchema,
  },
  FILL_BLANK: {
    draftSchema: fillBlankDraftSchema,
    evaluationSchema: fillBlankEvaluationSchema,
    submissionSchema: fillBlankSubmissionSchema,
  },
  SELECT: {
    draftSchema: selectDraftSchema,
    evaluationSchema: selectEvaluationSchema,
    submissionSchema: selectSubmissionSchema,
  },
  ORDER: {
    draftSchema: orderDraftSchema,
    evaluationSchema: orderEvaluationSchema,
    submissionSchema: orderSubmissionSchema,
  },
  MATCH: {
    draftSchema: matchDraftSchema,
    evaluationSchema: matchEvaluationSchema,
    submissionSchema: matchSubmissionSchema,
  },
  CATEGORIZE: {
    draftSchema: categorizeDraftSchema,
    evaluationSchema: categorizeEvaluationSchema,
    submissionSchema: categorizeSubmissionSchema,
  },
} as const satisfies Record<
  AnswerableLessonStepType,
  LearnerStepInteractionDefinition
>

export const learnerStepSubmissionSchema = z.discriminatedUnion("type", [
  learnerStepInteractionDefinitions.MULTIPLE_CHOICE.submissionSchema,
  learnerStepInteractionDefinitions.FILL_BLANK.submissionSchema,
  learnerStepInteractionDefinitions.SELECT.submissionSchema,
  learnerStepInteractionDefinitions.ORDER.submissionSchema,
  learnerStepInteractionDefinitions.MATCH.submissionSchema,
  learnerStepInteractionDefinitions.CATEGORIZE.submissionSchema,
])

export const learnerStepDraftAnswerSchema = z.discriminatedUnion("type", [
  learnerStepInteractionDefinitions.MULTIPLE_CHOICE.draftSchema,
  learnerStepInteractionDefinitions.FILL_BLANK.draftSchema,
  learnerStepInteractionDefinitions.SELECT.draftSchema,
  learnerStepInteractionDefinitions.ORDER.draftSchema,
  learnerStepInteractionDefinitions.MATCH.draftSchema,
  learnerStepInteractionDefinitions.CATEGORIZE.draftSchema,
])

export const stepEvaluationSchema = z.discriminatedUnion("type", [
  learnerStepInteractionDefinitions.MULTIPLE_CHOICE.evaluationSchema,
  learnerStepInteractionDefinitions.FILL_BLANK.evaluationSchema,
  learnerStepInteractionDefinitions.SELECT.evaluationSchema,
  learnerStepInteractionDefinitions.ORDER.evaluationSchema,
  learnerStepInteractionDefinitions.MATCH.evaluationSchema,
  learnerStepInteractionDefinitions.CATEGORIZE.evaluationSchema,
])

const learnerStepDraftVersionSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER - 1)

export const learnerStepDraftSchema = z.strictObject({
  answer: learnerStepDraftAnswerSchema,
  stepId: lessonStepIdSchema,
  updatedAt: z.string().datetime(),
  version: learnerStepDraftVersionSchema,
})

export const saveLearnerStepDraftBodySchema = z.strictObject({
  answer: learnerStepDraftAnswerSchema,
  expectedCurriculumVersionId: curriculumVersionIdSchema,
  expectedVersion: learnerStepDraftVersionSchema.nullable(),
})

export type LearnerStepSubmission = z.infer<typeof learnerStepSubmissionSchema>
export type LearnerStepDraftAnswer = z.infer<
  typeof learnerStepDraftAnswerSchema
>
export type LearnerStepDraft = z.infer<typeof learnerStepDraftSchema>
export type SaveLearnerStepDraftBody = z.infer<
  typeof saveLearnerStepDraftBodySchema
>
export type StepItemVerdict = z.infer<typeof stepItemVerdictSchema>
export type StepEvaluation = z.infer<typeof stepEvaluationSchema>
