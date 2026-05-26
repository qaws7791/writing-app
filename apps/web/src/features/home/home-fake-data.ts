import type { InProgressCourse } from "@/features/home/home-data"

function courseId(value: string): InProgressCourse["id"] {
  return value as InProgressCourse["id"]
}

function lessonId(value: string): InProgressCourse["lessons"][number]["id"] {
  return value as InProgressCourse["lessons"][number]["id"]
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
        id: lessonId("basic-sentence-writing-05"),
        name: "5강. 형용사 꾸밈과 명사의 배치",
        status: "completed",
      },
      {
        id: lessonId("basic-sentence-writing-06"),
        name: "6강. 부사어로 상황 더하기",
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
        id: lessonId("emotion-writing-02"),
        name: "2강. 감정 강도 표현",
        status: "completed",
      },
      {
        id: lessonId("emotion-writing-03"),
        name: "3강. 미묘한 감정 변화",
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
        id: lessonId("business-email-01"),
        name: "1강. 제목의 핵심 표현",
        status: "next-up",
      },
      {
        id: lessonId("business-email-02"),
        name: "2강. 첫 문장 목적 정리",
        status: "locked",
      },
    ],
  },
]
