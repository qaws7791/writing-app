import { describe, expect, it } from "vitest"

import {
  readLessonSummaryLines,
  readOptionalLessonText,
} from "@/features/course-editor/model/lesson-field-input"

describe("레슨 편집 입력 해석", () => {
  it("공백만 남은 선택 입력은 저장하지 않는 값으로 바꾼다", () => {
    expect(readOptionalLessonText("   ")).toBeNull()
    expect(readOptionalLessonText("")).toBeNull()
    expect(readOptionalLessonText(" 문장 다듬기 ")).toBe(" 문장 다듬기 ")
  })

  it("요약은 줄 단위 항목으로 바꾸고 빈 줄을 버린다", () => {
    expect(readLessonSummaryLines("첫 요약\n\n  둘째 요약  \n\n")).toEqual([
      "첫 요약",
      "둘째 요약",
    ])
    expect(readLessonSummaryLines("\n \n")).toEqual([])
  })
})
