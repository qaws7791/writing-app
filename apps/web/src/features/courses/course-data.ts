import { courseId, type CourseId } from "@/features/courses/course-ids"

export { courseId }
export type { Brand, CourseId } from "@/features/courses/course-ids"

export interface Course {
  id: CourseId
  title: string
  description: string
  lessonCount: number
  thumbnail: string
}

export interface CourseCategory {
  id: string
  title: string
  courses: readonly Course[]
}

export const courseCategories: readonly CourseCategory[] = [
  {
    id: "beginner",
    title: "입문자를 위한 코스",
    courses: [
      {
        id: courseId("sentence-structure"),
        title: "문장 구조의 기본",
        description:
          "한국어 문장의 뼈대를 이해하고 주어, 서술어, 목적어의 관계를 파악해 올바른 문장을 작성하는 방법을 배웁니다.",
        lessonCount: 12,
        thumbnail: "/course-thumbnails/sentence-structure.png",
      },
      {
        id: courseId("vocabulary-basics"),
        title: "어휘 확장 입문",
        description:
          "일상적인 글쓰기에 필요한 핵심 어휘를 익히고, 다양한 상황에서 정확한 단어를 선택하는 감각을 기릅니다.",
        lessonCount: 10,
        thumbnail: "/course-thumbnails/vocabulary-basics.png",
      },
      {
        id: courseId("reading-comprehension"),
        title: "독해와 요약",
        description:
          "글의 핵심 내용을 파악하고 간결하게 요약하는 능력을 키웁니다. 다양한 장르의 텍스트를 읽고 분석합니다.",
        lessonCount: 8,
        thumbnail: "/course-thumbnails/reading-comprehension.png",
      },
    ],
  },
  {
    id: "grammar",
    title: "문법 심화",
    courses: [
      {
        id: courseId("grammar-complete"),
        title: "문법 완성",
        description:
          "맞춤법, 띄어쓰기, 문장 부호 등 한국어 표기법의 핵심 규칙을 체계적으로 정리하고 실습합니다.",
        lessonCount: 15,
        thumbnail: "/course-thumbnails/grammar-complete.png",
      },
      {
        id: courseId("expression"),
        title: "표현력 향상",
        description:
          "같은 내용을 더 풍부하고 생동감 있게 전달하는 표현 방법을 연습합니다. 피동문, 사동문, 비유 표현을 다룹니다.",
        lessonCount: 11,
        thumbnail: "/course-thumbnails/expression.png",
      },
    ],
  },
  {
    id: "practical",
    title: "실전 글쓰기",
    courses: [
      {
        id: courseId("essay-writing"),
        title: "에세이 쓰기",
        description:
          "주제 선정부터 개요 작성, 본문 전개, 마무리까지 설득력 있는 에세이를 완성하는 전 과정을 익힙니다.",
        lessonCount: 14,
        thumbnail: "/course-thumbnails/essay-writing.png",
      },
      {
        id: courseId("business-writing"),
        title: "비즈니스 글쓰기",
        description:
          "이메일, 보고서, 제안서 등 업무 환경에서 요구되는 명확하고 전문적인 문서 작성 스킬을 기릅니다.",
        lessonCount: 13,
        thumbnail: "/course-thumbnails/business-writing.png",
      },
      {
        id: courseId("creative-writing"),
        title: "창의적 글쓰기",
        description:
          "상상력을 자극하는 글쓰기 기법을 배웁니다. 단편 소설, 시, 수필 등 다양한 창작 형식을 탐구합니다.",
        lessonCount: 16,
        thumbnail: "/course-thumbnails/creative-writing.png",
      },
    ],
  },
]
