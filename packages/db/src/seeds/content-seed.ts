import { readFileSync } from "node:fs"
import { z } from "zod"

const seedLessonSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    sortOrder: z.number().int().positive(),
  })
  .strict()

const seedChapterSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    sortOrder: z.number().int().positive(),
    lessons: z.array(seedLessonSchema),
  })
  .strict()

const seedCourseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    sortOrder: z.number().int().positive(),
    chapters: z.array(seedChapterSchema),
  })
  .strict()

const contentSeedSchema = z
  .object({
    categories: z.array(
      z
        .object({
          id: z.string().min(1),
          title: z.string().min(1),
          sortOrder: z.number().int().positive(),
          courses: z.array(seedCourseSchema),
        })
        .strict()
    ),
  })
  .strict()

export type ContentSeed = z.infer<typeof contentSeedSchema>

export function parseContentSeedData(data: unknown): ContentSeed {
  return contentSeedSchema.parse(data)
}

function loadContentSeedData(): ContentSeed {
  const contentSeedJson = readFileSync(
    new URL("./content-seed-data.json", import.meta.url),
    "utf8"
  )

  return parseContentSeedData(JSON.parse(contentSeedJson))
}

export const contentSeed = loadContentSeedData()

export function createSeedLessonSteps(input: {
  categoryTitle: string
  courseId: string
  lessonId: string
  lessonTitle: string
  lessonDescription: string
  nextLessonTitle?: string
}) {
  return [
    {
      id: `${input.lessonId}-step-1`,
      lessonId: input.lessonId,
      type: "INTRO",
      sortOrder: 1,
      points: 10,
      required: true,
      content: {
        title: input.lessonTitle,
        category: input.categoryTitle,
        tagTone: "info",
        bullets: [
          `${input.lessonTitle}의 핵심 기준을 확인합니다.`,
          input.lessonDescription,
          "마지막에는 오늘의 기준을 한 문장으로 정리합니다.",
        ],
        estimatedMinutes: 8,
        totalSteps: 5,
      },
    },
    {
      id: `${input.lessonId}-step-2`,
      lessonId: input.lessonId,
      type: "SHORT_WRITE",
      sortOrder: 2,
      points: 10,
      required: true,
      content: {
        instruction: "오늘 배운 기준을 적용해 한 문장을 작성하세요.",
        prompt: `${input.lessonTitle}의 핵심 기준이 드러나도록 짧은 문장을 써 보세요.`,
        maxChars: 160,
        minChars: 10,
        referenceAnswer: `${input.lessonTitle}에서는 기준을 먼저 세우고 문장을 점검합니다.`,
        aiEvaluationEnabled: true,
        showReferenceAfterSubmit: true,
      },
    },
    {
      id: `${input.lessonId}-step-3`,
      lessonId: input.lessonId,
      type: "AI_FEEDBACK",
      sortOrder: 3,
      points: 0,
      required: true,
      content: {
        sourceStepId: `${input.lessonId}-step-2`,
        feedbackPrompt: `${input.lessonTitle} 과제에서 기준이 분명히 드러나는지 평가합니다.`,
        focusAreas: ["clarity", "expression"],
        showScore: true,
        scoreRange: [0, 5],
        allowRevision: true,
        maxRevisions: 3,
      },
    },
    {
      id: `${input.lessonId}-step-4`,
      lessonId: input.lessonId,
      type: "SUMMARY",
      sortOrder: 4,
      points: 10,
      required: true,
      content: {
        points: [
          {
            number: 1,
            text: `${input.lessonTitle}에서는 문장의 기준을 먼저 세웁니다.`,
            icon: "1",
          },
          {
            number: 2,
            text: input.lessonDescription,
            icon: "2",
          },
        ],
        nextLesson: input.nextLessonTitle
          ? {
              title: input.nextLessonTitle,
            }
          : undefined,
      },
    },
    {
      id: `${input.lessonId}-step-5`,
      lessonId: input.lessonId,
      type: "COMPLETE",
      sortOrder: 5,
      points: 0,
      required: true,
      content: {
        nextAction: "next-lesson",
      },
    },
  ] as const
}
