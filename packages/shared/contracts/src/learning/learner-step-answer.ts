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

const trueFalseSubmissionSchema = z.strictObject({
  selectedAnswer: z.boolean(),
  type: z.literal("TRUE_FALSE"),
})
const trueFalseDraftSchema = z.strictObject({
  selectedAnswer: z.boolean().nullable(),
  type: z.literal("TRUE_FALSE"),
})

const sentenceBuildSubmissionSchema = z.strictObject({
  selectedTileIds: answerItemIdListSchema,
  type: z.literal("SENTENCE_BUILD"),
})
const sentenceBuildDraftSchema = z.strictObject({
  selectedTileIds: draftItemIdListSchema,
  type: z.literal("SENTENCE_BUILD"),
})

const errorCorrectSubmissionSchema = z.strictObject({
  selectedFixId: lessonStepItemIdSchema,
  selectedSegmentId: lessonStepItemIdSchema,
  type: z.literal("ERROR_CORRECT"),
})
const errorCorrectDraftSchema = z.strictObject({
  selectedFixId: lessonStepItemIdSchema.nullable(),
  selectedSegmentId: lessonStepItemIdSchema.nullable(),
  type: z.literal("ERROR_CORRECT"),
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
const trueFalseEvaluationSchema = z.strictObject({
  correct: z.boolean(),
  correctAnswer: z.boolean(),
  explanation: z.string(),
  type: z.literal("TRUE_FALSE"),
})
const sentenceBuildEvaluationSchema = choiceEvaluationBaseSchema.extend({
  type: z.literal("SENTENCE_BUILD"),
})
const errorCorrectEvaluationSchema = z.strictObject({
  correct: z.boolean(),
  correctFixId: lessonStepItemIdSchema,
  correctSegmentId: lessonStepItemIdSchema,
  explanation: z.string(),
  type: z.literal("ERROR_CORRECT"),
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
  TRUE_FALSE: {
    draftSchema: trueFalseDraftSchema,
    evaluationSchema: trueFalseEvaluationSchema,
    submissionSchema: trueFalseSubmissionSchema,
  },
  SENTENCE_BUILD: {
    draftSchema: sentenceBuildDraftSchema,
    evaluationSchema: sentenceBuildEvaluationSchema,
    submissionSchema: sentenceBuildSubmissionSchema,
  },
  ERROR_CORRECT: {
    draftSchema: errorCorrectDraftSchema,
    evaluationSchema: errorCorrectEvaluationSchema,
    submissionSchema: errorCorrectSubmissionSchema,
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
  learnerStepInteractionDefinitions.TRUE_FALSE.submissionSchema,
  learnerStepInteractionDefinitions.SENTENCE_BUILD.submissionSchema,
  learnerStepInteractionDefinitions.ERROR_CORRECT.submissionSchema,
])

export const learnerStepDraftAnswerSchema = z.discriminatedUnion("type", [
  learnerStepInteractionDefinitions.MULTIPLE_CHOICE.draftSchema,
  learnerStepInteractionDefinitions.FILL_BLANK.draftSchema,
  learnerStepInteractionDefinitions.SELECT.draftSchema,
  learnerStepInteractionDefinitions.ORDER.draftSchema,
  learnerStepInteractionDefinitions.MATCH.draftSchema,
  learnerStepInteractionDefinitions.CATEGORIZE.draftSchema,
  learnerStepInteractionDefinitions.TRUE_FALSE.draftSchema,
  learnerStepInteractionDefinitions.SENTENCE_BUILD.draftSchema,
  learnerStepInteractionDefinitions.ERROR_CORRECT.draftSchema,
])

export const stepEvaluationSchema = z.discriminatedUnion("type", [
  learnerStepInteractionDefinitions.MULTIPLE_CHOICE.evaluationSchema,
  learnerStepInteractionDefinitions.FILL_BLANK.evaluationSchema,
  learnerStepInteractionDefinitions.SELECT.evaluationSchema,
  learnerStepInteractionDefinitions.ORDER.evaluationSchema,
  learnerStepInteractionDefinitions.MATCH.evaluationSchema,
  learnerStepInteractionDefinitions.CATEGORIZE.evaluationSchema,
  learnerStepInteractionDefinitions.TRUE_FALSE.evaluationSchema,
  learnerStepInteractionDefinitions.SENTENCE_BUILD.evaluationSchema,
  learnerStepInteractionDefinitions.ERROR_CORRECT.evaluationSchema,
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
