import type {
  CourseDetail,
  CourseLessonSummary,
  LessonProgressStatus,
  ProgressCourse,
} from "@/features/courses/course-types"

type KwepFallbackLesson = CourseLessonSummary & {
  readonly hasSteps: boolean
}

type KwepFallbackUnit = CourseDetail["units"][number] & {
  readonly lessons: readonly KwepFallbackLesson[]
}

type KwepFallbackCourse = CourseDetail & {
  readonly units: readonly KwepFallbackUnit[]
}

const fallbackCourses: readonly KwepFallbackCourse[] = [
  {
    category: "입문자를 위한 코스",
    description:
      "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
    id: "c1",
    lessonCount: 10,
    progress: {
      completedLessons: 0,
      totalLessons: 10,
    },
    progressPercent: 0,
    status: "active",
    title: "글쓰기 첫걸음 30일",
    units: [
      {
        id: "u1",
        lessons: [
          createLesson({
            category: "문장의 기본기",
            description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
            estimatedMinutes: 5,
            id: "l1",
            order: 1,
            title: "좋은 문장이란 무엇인가",
          }),
          createLesson({
            category: "기능 소개",
            description:
              "매칭·분류·계획·교정·자가 점검 다섯 가지 활동을 차례로 체험해보세요.",
            estimatedMinutes: 10,
            id: "l-new",
            order: 2,
            title: "새 학습 활동 둘러보기",
          }),
          createLesson({
            category: "문장의 기본기",
            description: "주제문과 뒷받침 문장으로 단단한 문단을 만드는 법.",
            estimatedMinutes: 8,
            id: "l2",
            order: 3,
            title: "한 문단의 구조",
          }),
          createLesson({
            category: "문장의 기본기",
            description: "같은 뜻도 더 정확한 단어로 바꿔 쓰는 훈련을 합니다.",
            estimatedMinutes: 6,
            id: "l3",
            order: 4,
            title: "어휘력 키우기",
          }),
        ],
        order: 1,
        title: "문장의 기본기",
      },
      {
        id: "u2",
        lessons: [
          createLesson({
            category: "문단 완성하기",
            description: "하나의 문단이 한 방향으로 흐르는 비결을 배웁니다.",
            estimatedMinutes: 9,
            id: "l8",
            order: 1,
            title: "문단의 통일성과 응집력",
          }),
          createLesson({
            category: "문단 완성하기",
            description: "문장과 문장을 자연스럽게 잇는 연결어를 익힙니다.",
            estimatedMinutes: 7,
            id: "l9",
            order: 2,
            title: "전환어로 흐름 만들기",
          }),
          createLesson({
            category: "문단 완성하기",
            description: "서론-본론-결론을 갖춘 짧은 글 한 편을 완성합니다.",
            estimatedMinutes: 12,
            id: "l10",
            order: 3,
            title: "짧은 글 한 편 완성하기",
          }),
        ],
        order: 2,
        title: "문단 완성하기",
      },
      {
        id: "u3",
        lessons: [
          createLesson({
            category: "글의 시작과 끝",
            description: "첫 문장으로 독자를 끌어당기는 다섯 가지 방법.",
            estimatedMinutes: 8,
            id: "l11",
            order: 1,
            title: "독자의 눈을 여는 도입부",
          }),
          createLesson({
            category: "글의 시작과 끝",
            description: "독자의 마음에 잔상을 남기는 끝맺음을 배웁니다.",
            estimatedMinutes: 8,
            id: "l12",
            order: 2,
            title: "여운을 남기는 마무리 문장",
          }),
          createLesson({
            category: "글의 시작과 끝",
            description: "클릭하고 싶은 제목의 공식을 익힙니다.",
            estimatedMinutes: 6,
            id: "l13",
            order: 3,
            title: "제목 쓰는 법",
          }),
        ],
        order: 3,
        title: "글의 시작과 끝",
      },
    ],
  },
]

export function getFallbackCourseDetail(id: string): CourseDetail | undefined {
  return fallbackCourses.find((course) => course.id === id)
}

export function createFallbackProgressCourse(
  course: CourseDetail
): ProgressCourse {
  const lessons = flattenLessons(course)
  const progressLessons = lessons.map((lesson, index) => ({
    currentStepIndex: null,
    estimatedMinutes: lesson.estimatedMinutes,
    id: lesson.id,
    status: resolveFreshLessonStatus(lessons, index),
    title: lesson.title,
  }))
  const nextLesson = progressLessons.find(
    (lesson) => lesson.status === "available"
  )

  return {
    id: course.id,
    lessons: progressLessons,
    nextLessons:
      nextLesson === undefined
        ? []
        : [
            {
              ...nextLesson,
              courseId: course.id,
            },
          ],
    progressPercent: 0,
    title: course.title,
  }
}

function createLesson(
  lesson: Omit<KwepFallbackLesson, "hasSteps" | "status">
): KwepFallbackLesson {
  return {
    ...lesson,
    hasSteps: true,
    status: "active",
  }
}

function flattenLessons(course: CourseDetail): readonly KwepFallbackLesson[] {
  return course.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      ...lesson,
      hasSteps: true,
    }))
  )
}

function resolveFreshLessonStatus(
  lessons: readonly KwepFallbackLesson[],
  index: number
): LessonProgressStatus {
  const lesson = lessons[index]

  if (lesson === undefined || !lesson.hasSteps) {
    return "locked"
  }

  return index === 0 ? "available" : "locked"
}
