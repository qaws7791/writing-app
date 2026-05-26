import { z } from "zod"

export const lessonToneSchema = z.enum([
  "primary",
  "success",
  "info",
  "warning",
  "danger",
  "neutral",
])

export const courseSummaryDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lessonCount: z.number().int().nonnegative(),
  thumbnail: z.string().min(1),
})

export const courseCategoryDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  courses: z.array(courseSummaryDtoSchema),
})

export const courseCategoryListDtoSchema = z.object({
  categories: z.array(courseCategoryDtoSchema),
})

export const courseLessonDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
})

export const courseChapterDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  lessons: z.array(courseLessonDtoSchema),
})

export const courseDetailDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  thumbnail: z.string().min(1),
  lessonCount: z.number().int().nonnegative(),
  firstLessonId: z.string().min(1).optional(),
  chapters: z.array(courseChapterDtoSchema),
})

const introContentSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  tagTone: lessonToneSchema,
  bullets: z.array(z.string().min(1)),
  estimatedMinutes: z.number().int().positive(),
  totalSteps: z.number().int().positive(),
  xpAvailable: z.number().int().nonnegative(),
})

const conceptContentSchema = z.object({
  subtitle: z.string().min(1),
  body: z.string().min(1),
  highlight: z
    .object({
      icon: z.string().min(1),
      text: z.string().min(1),
      tone: lessonToneSchema,
    })
    .optional(),
  keyTerms: z
    .array(
      z.object({
        term: z.string().min(1),
        definition: z.string().min(1),
      })
    )
    .optional(),
})

const readingPassageContentSchema = z.object({
  instruction: z.string().min(1),
  title: z.string().min(1),
  source: z.string().min(1).optional(),
  text: z.string().min(1),
  estimatedReadMinutes: z.number().int().positive(),
  highlightEnabled: z.boolean(),
  focusQuestion: z.string().min(1).optional(),
})

const exampleRevealContentSchema = z.object({
  instruction: z.string().min(1),
  bad: z
    .object({
      label: z.string().min(1),
      text: z.string().min(1),
    })
    .optional(),
  good: z.object({
    label: z.string().min(1),
    text: z.string().min(1),
  }),
  analysis: z.string().min(1),
  revealTrigger: z.literal("button"),
})

const compareContentSchema = z.object({
  instruction: z.string().min(1),
  versions: z.array(
    z.object({
      label: z.string().min(1),
      text: z.string().min(1),
      tone: lessonToneSchema,
    })
  ),
  analysis: z.string().min(1),
  discussionQuestion: z.string().min(1).optional(),
})

const choiceOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
})

const multipleChoiceContentSchema = z.object({
  context: z.string().min(1).optional(),
  question: z.string().min(1),
  options: z.array(choiceOptionSchema),
  explanation: z.string().min(1),
  allowMultiple: z.literal(false),
  shuffleOptions: z.boolean(),
})

const fillBlankContentSchema = z.object({
  instruction: z.string().min(1),
  template: z.string().min(1),
  blanks: z.array(
    z.object({
      id: z.string().min(1),
      correctAnswers: z.array(z.string().min(1)),
      hint: z.string().min(1).optional(),
    })
  ),
  inputMode: z.literal("word-bank"),
  wordBank: z.array(z.string().min(1)),
  explanation: z.string().min(1),
  caseSensitive: z.boolean(),
})

const wordSelectContentSchema = z.object({
  instruction: z.string().min(1),
  markedText: z.string().min(1),
  globalExplanation: z.string().min(1),
  spanExplanations: z.record(z.string().min(1), z.string().min(1)),
})

const reorderContentSchema = z.object({
  instruction: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      correctOrder: z.number().int().positive(),
    })
  ),
  itemType: z.literal("sentence"),
  explanation: z.string().min(1),
  showNumberHint: z.boolean(),
})

const matchContentSchema = z.object({
  instruction: z.string().min(1),
  pairs: z.array(
    z.object({
      id: z.string().min(1),
      left: z.string().min(1),
      right: z.string().min(1),
    })
  ),
  shuffleRight: z.boolean(),
  displayMode: z.literal("tap-connect"),
  explanation: z.string().min(1),
})

const classifyContentSchema = z.object({
  instruction: z.string().min(1),
  categories: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      tone: lessonToneSchema,
    })
  ),
  items: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      correctCategoryId: z.string().min(1),
    })
  ),
  globalExplanation: z.string().min(1),
})

const shortWriteContentSchema = z.object({
  instruction: z.string().min(1),
  prompt: z.string().min(1),
  sourceText: z.string().min(1).optional(),
  maxChars: z.number().int().positive(),
  minChars: z.number().int().positive(),
  referenceAnswer: z.string().min(1),
  aiEvaluationEnabled: z.boolean(),
  showReferenceAfterSubmit: z.boolean(),
})

const longWriteContentSchema = z.object({
  instruction: z.string().min(1),
  topic: z.string().min(1),
  context: z.string().min(1).optional(),
  structureGuide: z.array(z.string().min(1)).optional(),
  minChars: z.number().int().positive(),
  targetChars: z.number().int().positive(),
  maxChars: z.number().int().positive(),
  aiEvaluationEnabled: z.boolean(),
  evaluationCriteria: z.string().min(1),
  draftSaveEnabled: z.boolean(),
})

const aiFeedbackContentSchema = z.object({
  sourceStepId: z.string().min(1),
  feedbackPrompt: z.string().min(1),
  focusAreas: z.array(z.enum(["clarity", "expression"])),
  showScore: z.boolean(),
  scoreRange: z.tuple([
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
  ]),
  allowRevision: z.boolean(),
  maxRevisions: z.number().int().nonnegative(),
})

const revisionContentSchema = z.object({
  instruction: z.string().min(1),
  revisionTask: z.string().min(1),
  originalText: z.string().min(1),
  hints: z.array(z.string().min(1)),
  revisionType: z.literal("targeted"),
  referenceRevision: z.string().min(1),
  aiEvaluationEnabled: z.boolean(),
  evaluationCriteria: z.string().min(1),
})

const checklistContentSchema = z.object({
  instruction: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      required: z.boolean(),
      tip: z.string().min(1).optional(),
    })
  ),
  completionMode: z.enum(["minimum", "all", "any"]),
  minimumChecks: z.number().int().nonnegative(),
  saveResponses: z.boolean(),
})

const reflectionContentSchema = z.object({
  question: z.string().min(1),
  context: z.string().min(1).optional(),
  promptStarters: z.array(z.string().min(1)),
  minChars: z.number().int().positive(),
  saveToJournal: z.boolean(),
  category: z.string().min(1),
  isSkippable: z.boolean(),
})

const summaryContentSchema = z.object({
  points: z.array(
    z.object({
      number: z.number().int().positive(),
      text: z.string().min(1),
      icon: z.string().min(1).optional(),
    })
  ),
  nextLesson: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1).optional(),
    })
    .optional(),
  shareableQuote: z.string().min(1).optional(),
})

const transcribeContentSchema = z.object({
  instruction: z.string().min(1),
  sourceText: z.string().min(1),
  source: z.string().min(1).optional(),
  showMatchRate: z.boolean(),
  caseSensitive: z.boolean(),
  punctuationSensitive: z.boolean(),
  focusNote: z.string().min(1).optional(),
})

const completeContentSchema = z.object({
  celebrationStyle: z.literal("confetti"),
  xpEarned: z.number().int().nonnegative(),
  showStreak: z.boolean(),
  lessonStats: z.object({
    correctRate: z.number().int().min(0).max(100).optional(),
    writingCount: z.number().int().nonnegative().optional(),
    aiFeedbackCount: z.number().int().nonnegative().optional(),
  }),
  nextAction: z.literal("next-lesson"),
})

function lessonStepSchema<TType extends string, TContent extends z.ZodType>(
  type: TType,
  content: TContent
) {
  return z.object({
    id: z.string().min(1),
    type: z.literal(type),
    order: z.number().int().positive(),
    points: z.number().int().nonnegative(),
    required: z.boolean(),
    content,
  })
}

export const lessonStepDtoSchema = z.discriminatedUnion("type", [
  lessonStepSchema("INTRO", introContentSchema),
  lessonStepSchema("CONCEPT", conceptContentSchema),
  lessonStepSchema("READING_PASSAGE", readingPassageContentSchema),
  lessonStepSchema("EXAMPLE_REVEAL", exampleRevealContentSchema),
  lessonStepSchema("COMPARE", compareContentSchema),
  lessonStepSchema("MULTIPLE_CHOICE", multipleChoiceContentSchema),
  lessonStepSchema("FILL_BLANK", fillBlankContentSchema),
  lessonStepSchema("WORD_SELECT", wordSelectContentSchema),
  lessonStepSchema("REORDER", reorderContentSchema),
  lessonStepSchema("MATCH", matchContentSchema),
  lessonStepSchema("CLASSIFY", classifyContentSchema),
  lessonStepSchema("SHORT_WRITE", shortWriteContentSchema),
  lessonStepSchema("LONG_WRITE", longWriteContentSchema),
  lessonStepSchema("AI_FEEDBACK", aiFeedbackContentSchema),
  lessonStepSchema("REVISION", revisionContentSchema),
  lessonStepSchema("CHECKLIST", checklistContentSchema),
  lessonStepSchema("REFLECTION", reflectionContentSchema),
  lessonStepSchema("SUMMARY", summaryContentSchema),
  lessonStepSchema("TRANSCRIBE", transcribeContentSchema),
  lessonStepSchema("COMPLETE", completeContentSchema),
])

export const lessonDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  categoryId: z.string().min(1),
  courseId: z.string().min(1),
  unitNumber: z.number().int().positive(),
  nextLessonId: z.string().min(1).optional(),
  steps: z.array(lessonStepDtoSchema),
})

export type CourseSummaryDto = z.infer<typeof courseSummaryDtoSchema>
export type CourseCategoryDto = z.infer<typeof courseCategoryDtoSchema>
export type CourseCategoryListDto = z.infer<typeof courseCategoryListDtoSchema>
export type CourseLessonDto = z.infer<typeof courseLessonDtoSchema>
export type CourseChapterDto = z.infer<typeof courseChapterDtoSchema>
export type CourseDetailDto = z.infer<typeof courseDetailDtoSchema>
export type LessonStepDto = z.infer<typeof lessonStepDtoSchema>
export type LessonDto = z.infer<typeof lessonDtoSchema>
