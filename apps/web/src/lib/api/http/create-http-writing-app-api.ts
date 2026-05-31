import { z } from "zod"

import {
  mapCourseCategoriesDto,
  mapCourseDetailDto,
  mergeCourseProgress,
} from "@/features/courses/course-api-mappers"
import { mapLessonDto } from "@/features/lessons/lesson-api-mappers"
import type { LessonId, LessonStepId } from "@/features/lessons/lesson-types"
import {
  apiErrorFromResponseBody,
  contractApiError,
  networkApiError,
} from "@/lib/api/api-error"
import { apiFailure, apiOk, type ApiResult } from "@/lib/api/api-result"
import type {
  AiFeedbackResult,
  CompleteLessonResult,
  CurrentUser,
  LessonProgress,
  WritingAppApi,
} from "@/lib/api/writing-app-api"
import {
  createOpenApiClient,
  type CreateOpenApiClientInput,
} from "@/lib/api/http/openapi-client"

export function createHttpWritingAppApi(
  input: CreateOpenApiClientInput
): WritingAppApi {
  const client = createOpenApiClient(input)

  return {
    async listCourseCategories() {
      return request(
        () => client.GET("/courses"),
        courseCategoryListDtoSchema,
        mapCourseCategoriesDto
      )
    },
    async getCourseDetail(courseId) {
      const course = await request(
        () =>
          client.GET("/courses/{courseId}", {
            params: { path: { courseId } },
          }),
        courseDetailDtoSchema,
        mapCourseDetailDto
      )
      if (course.status === "error") {
        return course
      }

      const progress = await this.getCourseProgress(courseId)
      if (progress.status === "error") {
        return apiOk(course.value)
      }

      return apiOk(
        mergeCourseProgress(course.value, {
          completedCount: progress.value.completedLessons,
          totalLessons: progress.value.totalLessons,
          progressPercent: progress.value.percentage,
        })
      )
    },
    async getLesson(lessonId) {
      return request(
        () =>
          client.GET("/lessons/{lessonId}", {
            params: { path: { lessonId } },
          }),
        lessonDtoSchema,
        mapLessonDto
      )
    },
    async getCurrentUser() {
      return request(
        () => client.GET("/me"),
        currentUserDtoSchema,
        (value) => value as CurrentUser
      )
    },
    async listProgress() {
      return request(
        () => client.GET("/progress"),
        progressCourseListDtoSchema,
        mapProgressCourseList
      )
    },
    async getCourseProgress(courseId) {
      return request(
        () =>
          client.GET("/courses/{courseId}/progress", {
            params: { path: { courseId } },
          }),
        courseProgressDtoSchema,
        (value) => ({
          completedLessons: value.completedCount,
          totalLessons: value.totalLessons,
          percentage: value.progressPercent,
        })
      )
    },
    async getLessonProgress(lessonId) {
      return request(
        () =>
          client.GET("/lessons/{lessonId}/progress", {
            params: { path: { lessonId } },
          }),
        lessonProgressDtoSchema,
        mapLessonProgress
      )
    },
    async saveLessonProgress(lessonId, body) {
      return request(
        () =>
          client.PUT("/lessons/{lessonId}/progress", {
            params: { path: { lessonId } },
            body,
          } as never),
        lessonProgressDtoSchema,
        mapLessonProgress
      )
    },
    async saveLessonAnswer(lessonId, body) {
      return request(
        () =>
          client.PUT("/lessons/{lessonId}/answers", {
            params: { path: { lessonId } },
            body,
          } as never),
        saveLessonAnswerResultDtoSchema,
        (value) => value
      )
    },
    async completeLesson(lessonId) {
      return request(
        () =>
          client.POST("/lessons/{lessonId}/complete", {
            params: { path: { lessonId } },
          }),
        completeLessonResultDtoSchema,
        mapCompleteLessonResult
      )
    },
    async createAiFeedback(body) {
      return request(
        () =>
          client.POST("/ai-feedback", {
            body,
          } as never),
        aiFeedbackResultDtoSchema,
        mapAiFeedbackResult
      )
    },
  }
}

function mapProgressCourseList(value: {
  courses: readonly {
    completedCount: number
    courseId: string
    nextLessonId?: string
    progressPercent: number
    totalLessons: number
  }[]
}) {
  return {
    courses: value.courses.map((course) => ({
      completedLessons: course.completedCount,
      courseId: course.courseId as never,
      nextLessonId: course.nextLessonId as never,
      percentage: course.progressPercent,
      totalLessons: course.totalLessons,
    })),
  }
}

async function request<TData, TParsedData, TValue>(
  run: () => Promise<{
    data?: TData
    error?: unknown
    response: Response
  }>,
  schema: z.ZodType<TParsedData>,
  map: (data: TParsedData) => TValue
): Promise<ApiResult<TValue>> {
  let result: {
    data?: TData
    error?: unknown
    response: Response
  }

  try {
    result = await run()
  } catch {
    return apiFailure(networkApiError())
  }

  const { data, error, response } = result
  if (error || !response.ok) {
    return apiFailure(apiErrorFromResponseBody(response.status, error))
  }
  if (data === undefined) {
    return apiFailure({
      code: "contract-error",
      message: "서버 응답에 데이터가 없습니다.",
    })
  }

  const parsedData = schema.safeParse(data)
  if (!parsedData.success) {
    return apiFailure(contractApiError())
  }

  try {
    return apiOk(map(parsedData.data))
  } catch {
    return apiFailure(contractApiError())
  }
}

const currentUserDtoSchema = z.object({
  email: z.string().email(),
  id: z.string().min(1),
  image: z.string().nullable(),
  name: z.string().min(1),
})

const courseSummaryDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lessonCount: z.number().int().nonnegative(),
})

const courseCategoryListDtoSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      courses: z.array(courseSummaryDtoSchema),
    })
  ),
})

const courseDetailDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lessonCount: z.number().int().nonnegative(),
  firstLessonId: z.string().min(1).optional(),
  chapters: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      lessons: z.array(
        z.object({
          id: z.string().min(1),
          lessonId: z.string().min(1),
          title: z.string().min(1),
          description: z.string().min(1),
          order: z.number().int().positive(),
        })
      ),
    })
  ),
})

const lessonToneDtoSchema = z.enum([
  "primary",
  "success",
  "info",
  "warning",
  "danger",
  "neutral",
])

function lessonStepDto<TType extends string, TContent extends z.ZodRawShape>(
  type: TType,
  content: TContent
) {
  return z.object({
    id: z.string().min(1),
    type: z.literal(type),
    order: z.number().int().positive(),
    points: z.number().int().nonnegative(),
    required: z.boolean(),
    content: z.object(content),
  })
}

const choiceOptionDtoSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
})

const lessonStepDtoSchema = z.discriminatedUnion("type", [
  lessonStepDto("INTRO", {
    title: z.string().min(1),
    category: z.string().min(1),
    tagTone: lessonToneDtoSchema,
    bullets: z.array(z.string().min(1)),
    estimatedMinutes: z.number().int().positive(),
    totalSteps: z.number().int().positive(),
  }),
  lessonStepDto("CONCEPT", {
    subtitle: z.string().min(1),
    body: z.string().min(1),
    highlight: z
      .object({
        icon: z.string().min(1),
        text: z.string().min(1),
        tone: lessonToneDtoSchema,
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
  }),
  lessonStepDto("READING_PASSAGE", {
    instruction: z.string().min(1),
    title: z.string().min(1),
    source: z.string().min(1).optional(),
    text: z.string().min(1),
    estimatedReadMinutes: z.number().int().positive(),
    highlightEnabled: z.boolean(),
    focusQuestion: z.string().min(1).optional(),
  }),
  lessonStepDto("EXAMPLE_REVEAL", {
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
  }),
  lessonStepDto("COMPARE", {
    instruction: z.string().min(1),
    versions: z.array(
      z.object({
        label: z.string().min(1),
        text: z.string().min(1),
        tone: lessonToneDtoSchema,
      })
    ),
    analysis: z.string().min(1),
    discussionQuestion: z.string().min(1).optional(),
  }),
  lessonStepDto("MULTIPLE_CHOICE", {
    context: z.string().min(1).optional(),
    question: z.string().min(1),
    options: z.array(choiceOptionDtoSchema),
    explanation: z.string().min(1),
    allowMultiple: z.literal(false),
    shuffleOptions: z.boolean(),
  }),
  lessonStepDto("FILL_BLANK", {
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
  }),
  lessonStepDto("WORD_SELECT", {
    instruction: z.string().min(1),
    markedText: z.string().min(1),
    globalExplanation: z.string().min(1),
    spanExplanations: z.record(z.string().min(1), z.string().min(1)),
  }),
  lessonStepDto("REORDER", {
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
  }),
  lessonStepDto("MATCH", {
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
  }),
  lessonStepDto("CLASSIFY", {
    instruction: z.string().min(1),
    categories: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        tone: lessonToneDtoSchema,
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
  }),
  lessonStepDto("SHORT_WRITE", {
    instruction: z.string().min(1),
    prompt: z.string().min(1),
    sourceText: z.string().min(1).optional(),
    maxChars: z.number().int().positive(),
    minChars: z.number().int().positive(),
    referenceAnswer: z.string().min(1),
    aiEvaluationEnabled: z.boolean(),
    showReferenceAfterSubmit: z.boolean(),
  }),
  lessonStepDto("LONG_WRITE", {
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
  }),
  lessonStepDto("AI_FEEDBACK", {
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
  }),
  lessonStepDto("REVISION", {
    instruction: z.string().min(1),
    revisionTask: z.string().min(1),
    originalText: z.string().min(1),
    hints: z.array(z.string().min(1)),
    revisionType: z.literal("targeted"),
    referenceRevision: z.string().min(1),
    aiEvaluationEnabled: z.boolean(),
    evaluationCriteria: z.string().min(1),
  }),
  lessonStepDto("CHECKLIST", {
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
  }),
  lessonStepDto("REFLECTION", {
    question: z.string().min(1),
    context: z.string().min(1).optional(),
    promptStarters: z.array(z.string().min(1)),
    minChars: z.number().int().positive(),
    saveToJournal: z.boolean(),
    category: z.string().min(1),
    isSkippable: z.boolean(),
  }),
  lessonStepDto("SUMMARY", {
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
  }),
  lessonStepDto("TRANSCRIBE", {
    instruction: z.string().min(1),
    sourceText: z.string().min(1),
    source: z.string().min(1).optional(),
    showMatchRate: z.boolean(),
    caseSensitive: z.boolean(),
    punctuationSensitive: z.boolean(),
    focusNote: z.string().min(1).optional(),
  }),
  lessonStepDto("COMPLETE", {
    nextAction: z.literal("next-lesson"),
  }),
])

const lessonDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  categoryId: z.string().min(1),
  courseId: z.string().min(1),
  unitNumber: z.number().int().positive(),
  nextLessonId: z.string().min(1).optional(),
  steps: z.array(lessonStepDtoSchema),
})

const progressCourseListDtoSchema = z.object({
  courses: z.array(
    z.object({
      completedCount: z.number().int().nonnegative(),
      courseId: z.string().min(1),
      nextLessonId: z.string().min(1).optional(),
      progressPercent: z.number().nonnegative(),
      totalLessons: z.number().int().nonnegative(),
    })
  ),
})

const courseProgressDtoSchema = z.object({
  completedCount: z.number().int().nonnegative(),
  nextLessonId: z.string().min(1).optional(),
  progressPercent: z.number().nonnegative(),
  totalLessons: z.number().int().nonnegative(),
})

const lessonProgressDtoSchema = z.object({
  answers: z.array(
    z.object({
      answer: z.string(),
      stepId: z.string().min(1),
    })
  ),
  currentStepId: z.string().min(1),
  lessonId: z.string().min(1),
  status: z.enum(["not-started", "in-progress", "completed"]),
  stepOrder: z.number().int().positive(),
})

const saveLessonAnswerResultDtoSchema = z.object({
  saved: z.literal(true),
})

const completeLessonResultDtoSchema = z.object({
  completedAt: z.string().min(1),
  completedCount: z.number().int().nonnegative(),
  lessonId: z.string().min(1),
  status: z.literal("completed"),
  wasAlreadyCompleted: z.boolean(),
})

const aiFeedbackResultDtoSchema = z.object({
  improvements: z.array(z.string()),
  nextAction: z.string(),
  score: z.number(),
  scoreRange: z.tuple([z.number(), z.number()]),
  strengths: z.array(z.string()),
  summary: z.string(),
})

function mapLessonProgress(value: {
  answers: readonly {
    answer: string
    stepId: string
  }[]
  currentStepId: string
  lessonId: string
  status: "not-started" | "in-progress" | "completed"
  stepOrder: number
}): LessonProgress {
  return {
    answers: value.answers.map((answer) => ({
      answer: answer.answer,
      stepId: answer.stepId as LessonStepId,
    })),
    currentStepId: value.currentStepId as LessonStepId,
    lessonId: value.lessonId as LessonId,
    status: value.status,
    stepOrder: value.stepOrder,
  }
}

function mapCompleteLessonResult(value: {
  completedAt: string
  completedCount: number
  lessonId: string
  status: "completed"
  wasAlreadyCompleted: boolean
}): CompleteLessonResult {
  return {
    completedAt: value.completedAt,
    completedCount: value.completedCount,
    lessonId: value.lessonId as LessonId,
    status: value.status,
    wasAlreadyCompleted: value.wasAlreadyCompleted,
  }
}

function mapAiFeedbackResult(value: {
  improvements: readonly string[]
  nextAction: string
  score: number
  scoreRange: readonly number[]
  strengths: readonly string[]
  summary: string
}): AiFeedbackResult {
  return {
    improvements: value.improvements,
    nextAction: value.nextAction,
    score: value.score,
    scoreRange: [value.scoreRange[0] ?? 0, value.scoreRange[1] ?? 100],
    strengths: value.strengths,
    summary: value.summary,
  }
}
