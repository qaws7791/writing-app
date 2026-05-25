export const contentSeed = {
  categories: [
    {
      id: "beginner",
      title: "입문자를 위한 코스",
      sortOrder: 1,
      courses: [
        {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description:
            "한국어 문장의 뼈대를 이해하고 주어, 서술어, 목적어의 관계를 파악해 올바른 문장을 작성하는 방법을 배웁니다.",
          thumbnail: "/course-thumbnails/sentence-structure.png",
          sortOrder: 1,
          chapters: [
            {
              id: "sentence-structure-chapter-1",
              label: "1단원",
              title: "문장의 뼈대",
              sortOrder: 1,
              lessons: [
                {
                  id: "sentence-structure-01",
                  title: "주어와 서술어 찾기",
                  description:
                    "문장의 중심 성분을 구분하고 기본 의미 관계를 확인합니다.",
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
} as const

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
        totalSteps: 3,
        xpAvailable: 20,
      },
    },
    {
      id: `${input.lessonId}-step-2`,
      lessonId: input.lessonId,
      type: "SUMMARY",
      sortOrder: 2,
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
        shareableQuote: `${input.lessonTitle}: 기준을 알고 고친 문장이 좋은 글을 만듭니다.`,
      },
    },
    {
      id: `${input.lessonId}-step-3`,
      lessonId: input.lessonId,
      type: "COMPLETE",
      sortOrder: 3,
      points: 0,
      required: true,
      content: {
        celebrationStyle: "confetti",
        xpEarned: 20,
        showStreak: true,
        lessonStats: {
          correctRate: 90,
          writingCount: 1,
          aiFeedbackCount: 0,
        },
        nextAction: "next-lesson",
      },
    },
  ] as const
}
