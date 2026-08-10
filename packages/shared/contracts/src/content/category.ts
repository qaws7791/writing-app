import { z } from "zod"

/**
 * 코스 카테고리는 학습자 코스 목록의 섹션과 어드민 필터·편집 선택지를 함께 결정한다.
 * 값 자체가 화면 표기이므로 별도 label 표를 두지 않는다.
 */
export const courseCategoryValues = [
  "언어와 읽기",
  "구성과 표현",
  "사고와 발상",
  "독자와 쓰기 과정",
  "정보와 AI 문해",
  "미분류",
] as const

export const uncategorizedCourseCategory = "미분류"

export const courseCategorySchema = z.enum(courseCategoryValues)

export type CourseCategory = z.infer<typeof courseCategorySchema>
