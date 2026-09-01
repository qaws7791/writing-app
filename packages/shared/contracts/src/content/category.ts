import { z } from "zod"

/**
 * 코스 카테고리는 학습자 코스 목록의 섹션과 어드민 필터·편집 선택지를 함께 결정한다.
 * 값 자체가 화면 표기이므로 별도 label 표를 두지 않는다.
 */
export const courseCategoryValues = [
  "표기·신뢰",
  "문장·교정",
  "어휘·표현",
  "실무·소통",
  "실무·구조",
  "논리·설득",
  "표현·공감",
  "문해·요약",
  "브랜딩·PR",
  "퇴고·캡스톤",
  "미분류",
] as const

export const uncategorizedCourseCategory = "미분류"

export const courseCategorySchema = z.enum(courseCategoryValues)

export type CourseCategory = z.infer<typeof courseCategorySchema>
