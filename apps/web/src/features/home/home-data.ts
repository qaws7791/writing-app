type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand
}

export type CourseId = Brand<string, "course-id">
export type LessonId = Brand<string, "lesson-id">

export type LessonStatus = "completed" | "next-up" | "locked"

export interface HomeLesson {
  id: LessonId
  name: string
  status: LessonStatus
}

export interface InProgressCourse {
  id: CourseId
  title: string
  description: string
  thumbnail: string
  completedLessons: number
  totalLessons: number
  progressPercent: number
  lessons: readonly HomeLesson[]
}

function courseId(value: string): CourseId {
  return value as CourseId
}

function lessonId(value: string): LessonId {
  return value as LessonId
}

export const inProgressCourses: readonly InProgressCourse[] = [
  {
    id: courseId("basic-sentence-writing"),
    title: "기초 문장 만들기",
    description: "주어, 서술어, 목적어의 긴밀한 관계 탐구",
    thumbnail: "/course-thumbnails/basic-sentence-writing.png",
    completedLessons: 5,
    totalLessons: 12,
    progressPercent: 41.6,
    lessons: [
      {
        id: lessonId("basic-sentence-writing-lesson-6"),
        name: "6강. 형용사 꾸밈과 명사의 배치",
        status: "completed",
      },
      {
        id: lessonId("basic-sentence-writing-lesson-7"),
        name: "7강. 부사구를 활용한 구체적인 묘사",
        status: "next-up",
      },
    ],
  },
  {
    id: courseId("emotion-writing"),
    title: "감정 표현 글쓰기",
    description: "추상적 상태를 정확한 서술어로 기술하는 법",
    thumbnail: "/course-thumbnails/emotion-writing.png",
    completedLessons: 2,
    totalLessons: 10,
    progressPercent: 20,
    lessons: [
      {
        id: lessonId("emotion-writing-lesson-3"),
        name: "3강. 미묘한 감정 변화와 어휘 사전",
        status: "completed",
      },
      {
        id: lessonId("emotion-writing-lesson-4"),
        name: "4강. 대상을 통해 감정 이입하기",
        status: "next-up",
      },
    ],
  },
  {
    id: courseId("business-email"),
    title: "비즈니스 이메일 작성법",
    description: "업무 격식과 명확한 전개로 신뢰감 구축",
    thumbnail: "/course-thumbnails/business-email.png",
    completedLessons: 0,
    totalLessons: 18,
    progressPercent: 0,
    lessons: [
      {
        id: lessonId("business-email-lesson-1"),
        name: "1강. 제목의 핵심 표현과 목적 정리",
        status: "next-up",
      },
      {
        id: lessonId("business-email-lesson-2"),
        name: "2강. 핵심 요약(Key Summary) 구성하기",
        status: "locked",
      },
    ],
  },
]
