import { describe, expect, it } from "vitest"

import {
  courseDetailDtoSchema,
  courseSummaryDtoSchema,
} from "@/content/content.dto"

describe("courseSummaryDtoSchema", () => {
  it("accepts course summaries without thumbnail assets", () => {
    expect(
      courseSummaryDtoSchema.parse({
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장의 뼈대를 이해합니다.",
        lessonCount: 12,
      })
    ).toEqual({
      id: "sentence-structure",
      title: "문장 구조의 기본",
      description: "문장의 뼈대를 이해합니다.",
      lessonCount: 12,
    })
  })
})

describe("courseDetailDtoSchema", () => {
  it("accepts course details without thumbnail assets", () => {
    expect(
      courseDetailDtoSchema.parse({
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장의 뼈대를 이해합니다.",
        lessonCount: 1,
        firstLessonId: "sentence-structure-01",
        chapters: [],
      })
    ).toEqual({
      id: "sentence-structure",
      title: "문장 구조의 기본",
      description: "문장의 뼈대를 이해합니다.",
      lessonCount: 1,
      firstLessonId: "sentence-structure-01",
      chapters: [],
    })
  })
})
